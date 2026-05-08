"use client";

import { useState, useRef, useCallback } from "react";

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

interface NodeMapState {
  status: "idle" | "chunking" | "extracting" | "merging" | "done" | "error";
  progress: string;
  currentStep: number;
  totalSteps: number;
  nodes: Node[];
  edges: Edge[];
  error: string | null;
}

const initialState: NodeMapState = {
  status: "idle",
  progress: "",
  currentStep: 0,
  totalSteps: 0,
  nodes: [],
  edges: [],
  error: null,
};

function ruleBasedChunk(text: string, maxChunkLen: number = 2000): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChunkLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function useNodeMap(text: string) {
  const [state, setState] = useState<NodeMapState>(initialState);
  const abortRef = useRef(false);

  const generate = useCallback(async () => {
    if (!text || text.length < 200) {
      setState({ ...initialState, error: "텍스트가 너무 짧아 노드맵을 생성할 수 없어요 (최소 200자)" });
      return;
    }

    abortRef.current = false;

    // Layer 1: Chunking
    setState({ ...initialState, status: "chunking", progress: "텍스트를 청킹하는 중..." });
    const chunks = ruleBasedChunk(text, 2000);

    // Layer 2: Extract nodes from each chunk + Layer 3: Sequential merge
    // Both layers run on the server in a single request
    const totalSteps = chunks.length + Math.max(0, chunks.length - 1);
    setState({
      status: "extracting",
      progress: `노드 추출 중... (0/${chunks.length} 청크)`,
      currentStep: 0,
      totalSteps,
      nodes: [],
      edges: [],
      error: null,
    });

    try {
      const response = await fetch("/api/extract-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunks }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (abortRef.current) return;

      const data = await response.json();

      if (abortRef.current) return;

      setState({
        status: "done",
        progress: "완료!",
        currentStep: totalSteps,
        totalSteps,
        nodes: data.nodes || [],
        edges: data.edges || [],
        error: null,
      });
    } catch (err: any) {
      if (abortRef.current) return;
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err.message || "노드맵 생성 실패",
      }));
    }
  }, [text]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(initialState);
  }, []);

  return { ...state, generate, reset };
}
