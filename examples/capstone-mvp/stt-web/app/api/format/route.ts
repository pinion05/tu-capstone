import { NextRequest } from "next/server";

const API_URL = process.env.LLM_BASE_URL || "https://api.z.ai/api/coding/paas/v4";

interface FormatRequest {
  text: string;
  cursor: number;
}

const SYSTEM_PROMPT = `너는 음성 인식(STT) 트랜스크립트를 읽기 좋게 포매팅하는 에이전트야.

## 작업
텍스트를 문단 단위로 줄바꿈해. 내용은 절대 변경하지 마 (줄바꿈만 추가).

## 줄바꿈 규칙
- 주제나 의미가 바뀌는 지점에서 줄바꿈
- 마침표, 물음표, 느낌표 뒤가 자연스러운 경계
- 3~5문장마다 최소 한 번은 줄바꿈 (아무리 길어도)
- 빈 줄을 하나 추가해서 문단 구분 (\`\\n\\n\`)

## 중요: processed_chars
- 원본 텍스트에서 실제로 처리한 글자 수
- 반드시 원본 길이보다 작아야 해 (전체를 다 처리하려 하지 마)
- 문장이 완전히 끝나는 지점에서 멈춰
- 이상적인 범위: 원본의 60~90%

## 출력 (반드시 이 JSON만, 다른 텍스트 절대 금지)
{"formatted": "줄바꿈된\\n\\n텍스트", "processed_chars": 1200}

## 예시
입력: "인공지능은 컴퓨터 과학의 한 분야다. 빠르게 발전하고 있다. 기계학습이 핵심이다. 신경망 모델이 좋은 성능을 보인다. 최근 대규모 언어 모델이 등장했다. 활용 범위가 확대되었다."
출력: {"formatted": "인공지능은 컴퓨터 과학의 한 분야다. 빠르게 발전하고 있다. 기계학습이 핵심이다. 신경망 모델이 좋은 성능을 보인다.\\n\\n최근 대규모 언어 모델이 등장했다. 활용 범위가 확대되었다.", "processed_chars": 83}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "glm-5-turbo";

  if (!apiKey) {
    return Response.json(
      { error: "LLM_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: FormatRequest = await req.json();
  const { text, cursor } = body;

  if (!text || text.length === 0) {
    return Response.json({ formatted: "", new_cursor: cursor, processed_chars: 0 });
  }

  const userMessage = `cursor: ${cursor}
=== 텍스트 (${text.length}글자) ===
${text}
=== 끝 ===`;

  try {
    const response = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `LLM API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsed: { formatted: string; processed_chars: number } | null = null;

    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch { /* fallback below */ }
      }
    }

    if (!parsed || typeof parsed.processed_chars !== "number") {
      // LLM failed — apply rule-based fallback
      const { formatted, cutPoint } = ruleBasedFormat(text);
      return Response.json({
        formatted,
        new_cursor: cursor + cutPoint,
        processed_chars: cutPoint,
      });
    }

    let processedChars = Math.max(1, Math.min(parsed.processed_chars, text.length));

    // Guard: if LLM processed 100% of text, cap at 85% to prevent skip
    if (processedChars >= text.length) {
      processedChars = Math.floor(text.length * 0.85);
      // Adjust to nearest sentence boundary
      const sliced = text.slice(0, processedChars);
      const lastPeriod = Math.max(
        sliced.lastIndexOf("."),
        sliced.lastIndexOf("?"),
        sliced.lastIndexOf("!"),
      );
      if (lastPeriod > Math.floor(text.length * 0.5)) {
        processedChars = lastPeriod + 1;
      }
    }

    let formatted = parsed.formatted || text;

    // Server-side validation: ensure formatted has line breaks
    const lineBreakCount = (formatted.match(/\n/g) || []).length;
    if (lineBreakCount === 0) {
      // LLM returned no line breaks — apply rule-based formatting
      formatted = ruleBasedFormat(text.slice(0, processedChars)).formatted;
    }

    const newCursor = cursor + processedChars;

    return Response.json({
      formatted,
      new_cursor: newCursor,
      processed_chars: processedChars,
    });
  } catch (err) {
    // On error, apply rule-based fallback
    const { formatted, cutPoint } = ruleBasedFormat(text);
    return Response.json({
      formatted,
      new_cursor: cursor + cutPoint,
      processed_chars: cutPoint,
    });
  }
}

/**
 * Rule-based fallback: insert paragraph breaks at sentence boundaries
 * No LLM needed — guaranteed to always produce line breaks.
 */
function ruleBasedFormat(text: string): { formatted: string; cutPoint: number } {
  // Cut at ~75-85% of text at a sentence boundary
  const idealCut = Math.floor(text.length * 0.8);
  let cutPoint = idealCut;

  // Find nearest sentence boundary within 60-90% range
  const minCut = Math.floor(text.length * 0.6);
  const maxCut = Math.floor(text.length * 0.9);
  const searchRange = text.slice(minCut, maxCut);

  // Find all sentence endings in range
  const endings: number[] = [];
  for (let i = 0; i < searchRange.length; i++) {
    const ch = searchRange[i];
    if (ch === "." || ch === "?" || ch === "!") {
      endings.push(minCut + i + 1);
    }
  }

  if (endings.length > 0) {
    // Pick the one closest to idealCut
    cutPoint = endings.reduce((prev, curr) =>
      Math.abs(curr - idealCut) < Math.abs(prev - idealCut) ? curr : prev
    );
  }

  const targetText = text.slice(0, cutPoint);

  // Insert double newlines at sentence boundaries (every 2-4 sentences)
  const sentences = targetText.match(/[^.!?]+[.!?]+/g) || [targetText];
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < sentences.length; i++) {
    currentLine += sentences[i].trim();
    // Break every 2-3 sentences
    if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
      lines.push(currentLine.trim());
      currentLine = "";
    } else {
      currentLine += " ";
    }
  }

  return {
    formatted: lines.join("\n\n"),
    cutPoint,
  };
}
