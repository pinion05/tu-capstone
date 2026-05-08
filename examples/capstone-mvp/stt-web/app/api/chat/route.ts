import { NextRequest } from "next/server";

const API_URL = process.env.LLM_BASE_URL || "https://api.z.ai/api/coding/paas/v4";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  transcription: string;
  highlight?: string | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "glm-5-turbo";

  if (!apiKey) {
    return Response.json(
      { error: "LLM_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: ChatRequest = await req.json();
  const { messages, transcription, highlight } = body;

  let contextBlock = "";

  if (highlight) {
    contextBlock = `사용자가 녹음에서 특정 부분을 드래그해서 강조했어. 이 부분에 대해 물어보는 거니까 이 부분을 우선적으로 참고해서 답해.

=== 사용자가 강조한 부분 ===
${highlight}
=== 강조 끝 ===

전체 맥락을 위해 전체 녹음도 참고해:
=== 전체 녹음 ===
${transcription || "(녹음 없음)"}
=== 녹음 끝 ===`;
  } else {
    contextBlock = `아래는 이전 질문 이후 새로 녹음된 내용이야. 이전 대화 히스토리와 합쳐서 전체 맥락을 파악해.
새로 녹음된 내용이 없으면 이전 대화 맥락만으로 답해.

=== 새로 녹음된 내용 ===
${transcription || "(새로 녹음된 내용 없음)"}
=== 끝 ===`;
  }

  const systemPrompt = `너는 실시간 음성 인식(STT) 트랜스크립션을 읽고 사용자와 대화하는 AI 어시스턴트야.

${contextBlock}

규칙:
- 한국어로 대답해
- 녹음된 내용과 대화 히스토리를 바탕으로 질문에 답해
- 간결하고 명확하게 대답해`;

  const apiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return Response.json(
      { error: `LLM API error: ${response.status}`, details: errorText },
      { status: response.status }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
