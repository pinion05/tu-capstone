"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface STTMessage {
  type: "listening" | "interim" | "final" | "speech_ended" | "error" | "config_ack";
  text?: string;
  confidence?: number;
  index?: number;
  progress?: number;
  cumulative_text?: string;
  message?: string;
}

export interface STTConfig {
  url?: string;
  mode?: "stream" | "simulate";
  textFile?: string;
  speed?: number;
  language?: string;
}

interface UseSTTStreamReturn {
  finalText: string;
  interimText: string;
  displayText: string;
  isListening: boolean;
  progress: number;
  confidence: number;
  segmentCount: number;
  error: string | null;
  connect: (config?: Partial<STTConfig>) => void;
  disconnect: () => void;
}

const DEFAULT_WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_STT_WS_URL || "ws://localhost:8765")
    : "";

export function useSTTStream(initialConfig?: STTConfig): UseSTTStreamReturn {
  const [finalSegments, setFinalSegments] = useState<string[]>([]);
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const configRef = useRef<STTConfig>({
    url: DEFAULT_WS_URL,
    mode: "simulate",
    speed: 1,
    language: "ko",
    ...initialConfig,
  });

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const connect = useCallback((override?: Partial<STTConfig>) => {
    if (wsRef.current) wsRef.current.close();

    const config = { ...configRef.current, ...override };
    configRef.current = config;

    setError(null);
    setFinalSegments([]);
    setInterimText("");
    setProgress(0);
    setConfidence(0);

    const params = new URLSearchParams();
    if (config.language) params.set("language", config.language);
    if (config.textFile) params.set("text_file", config.textFile);
    if (config.speed) params.set("speed", String(config.speed));

    const endpoint = config.mode === "simulate" ? "/stt/simulate" : "/stt/stream";
    const url = `${config.url}${endpoint}?${params.toString()}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsListening(true);

    ws.onmessage = (event) => {
      try {
        const msg: STTMessage = JSON.parse(event.data);
        switch (msg.type) {
          case "interim":
            setInterimText(msg.text || "");
            if (msg.progress !== undefined) setProgress(msg.progress);
            break;
          case "final":
            if (msg.text) setFinalSegments((p) => [...p, msg.text!]);
            setInterimText("");
            if (msg.confidence !== undefined) setConfidence(msg.confidence);
            if (msg.progress !== undefined) setProgress(msg.progress);
            break;
          case "speech_ended":
            setIsListening(false);
            setProgress(100);
            setInterimText("");
            break;
          case "error":
            setError(msg.message || "Unknown error");
            setIsListening(false);
            break;
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {
      setError("WebSocket 연결 실패 — 서버가 실행 중인지 확인하세요");
      setIsListening(false);
    };
    ws.onclose = () => setIsListening(false);
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "terminate" }));
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsListening(false);
  }, []);

  const finalText = finalSegments.join("");
  const displayText = interimText ? `${finalText} ${interimText}`.trim() : finalText;

  return { finalText, interimText, displayText, isListening, progress, confidence, segmentCount: finalSegments.length, error, connect, disconnect };
}
