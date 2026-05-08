import { NextRequest } from "next/server";

const API_URL = process.env.LLM_BASE_URL || "https://api.z.ai/api/coding/paas/v4";

interface Node {
  name: string;
  type: string;
  summary: string;
  importance: "high" | "medium" | "low";
}

interface Edge {
  from: string;
  to: string;
  relation: string;
}

interface NodeMap {
  nodes: Node[];
  edges: Edge[];
}

const EXTRACT_PROMPT = `너는 강의 트랜스크립트에서 핵심 개념과 용어를 추출하여 지식 그래프를 만드는 에이전트야.

## 작업
주어진 텍스트에서 핵심 개념/용어를 노드로, 그들 간의 관계를 엣지로 추출해.

## 노드 형식
- name: 개념/용어 이름 (간결하게)
- type: "concept" (고정)
- summary: 1~2문장으로 개념 설명
- importance: "high" | "medium" | "low" (강의에서 중요도)

## 엣지 형식
- from: 출발 노드 이름
- to: 도착 노드 이름
- relation: 관계를 한 단어나 짧은 구로 (예: "포함", "기반", "사용", "응용", "발전")

## 규칙
- 3~10개 정도의 핵심 개념만 추출 (너무 많이 뽑지 마)
- 모든 개념이 연결될 필요는 없어 (중요한 관계만)
- summary는 텍스트 내용 기반으로 작성
- 동일한 개념이 다른 이름으로 나오면 하나로 통합

## 출력 (반드시 이 JSON만, 다른 텍스트 절대 금지)
{"nodes": [{"name": "개념명", "type": "concept", "summary": "설명", "importance": "high"}], "edges": [{"from": "A", "to": "B", "relation": "관계"}]}`;

const MERGE_PROMPT = `너는 두 개의 지식 그래프(노드맵)를 하나로 병합하는 에이전트야.

## 병합 규칙
1. **동일 개념**: 비슷한 개념은 하나로 병합 (예: "신경망" + "인공신경망" → "인공신경망")
2. **중복 관계**: 같은 관계가 반복되면 하나로 합치기
3. **모순 정보**: 서로 다른 정보가 있으면 AND로 결합 (예: "이미지 처리용이며 자연어 처리에도 사용됨")
4. **중요도 충돌**: 두 노드의 중요도가 다르면 더 높은 쪽을 선택

## 출력 (반드시 이 JSON만, 다른 텍스트 절대 금지)
{"nodes": [...], "edges": [...], "stats": {"nodesBefore": 0, "nodesAfter": 0, "edgesBefore": 0, "edgesAfter": 0, "merged": 0, "contradictionsResolved": 0}}`;

async function callLLM(systemPrompt: string, userMessage: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON<T>(content: string): T | null {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch { /* ignore */ }
    }
    // Try to find raw JSON object
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try { return JSON.parse(braceMatch[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

// POST /api/extract-nodes — Layer 2: single chunk → node map
export async function POST(req: NextRequest) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "glm-5-turbo";

  if (!apiKey) {
    return Response.json({ error: "LLM_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { chunks } = body as { chunks: string[] };

  if (!chunks || chunks.length === 0) {
    return Response.json({ error: "chunks is required" }, { status: 400 });
  }

  // Layer 2: Extract nodes from each chunk
  const nodeMaps: NodeMap[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const userMessage = `=== 청크 ${i + 1}/${chunks.length} ===\n${chunks[i]}\n=== 끝 ===`;
    try {
      const content = await callLLM(EXTRACT_PROMPT, userMessage, apiKey, model);
      const parsed = parseJSON<{ nodes: Node[]; edges: Edge[] }>(content);
      if (parsed && parsed.nodes && Array.isArray(parsed.nodes)) {
        nodeMaps.push({ nodes: parsed.nodes, edges: parsed.edges || [] });
      } else {
        nodeMaps.push({ nodes: [], edges: [] });
      }
    } catch {
      nodeMaps.push({ nodes: [], edges: [] });
    }
  }

  if (nodeMaps.length === 0) {
    return Response.json({ nodes: [], edges: [] });
  }

  // Layer 3: Sequential merge
  let merged: NodeMap = nodeMaps[0];
  for (let i = 1; i < nodeMaps.length; i++) {
    const userMessage = `=== 노드맵 A (기존 통합본) ===\n${JSON.stringify(merged, null, 2)}\n=== 끝 ===\n\n=== 노드맵 B (새 청크) ===\n${JSON.stringify(nodeMaps[i], null, 2)}\n=== 끝 ===`;
    try {
      const content = await callLLM(MERGE_PROMPT, userMessage, apiKey, model);
      const parsed = parseJSON<{ nodes: Node[]; edges: Edge[]; stats?: any }>(content);
      if (parsed && parsed.nodes && Array.isArray(parsed.nodes)) {
        merged = { nodes: parsed.nodes, edges: parsed.edges || [] };
      }
      // If parse fails, keep previous merged as-is
    } catch {
      // Keep previous merged as-is on error
    }
  }

  return Response.json(merged);
}
