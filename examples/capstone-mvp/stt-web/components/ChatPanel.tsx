"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  transcription: string;
  highlight: string | null;
  onHighlightUsed: () => void;
}

export default function ChatPanel({ transcription, highlight, onHighlightUsed }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    // Only send NEW transcript since last chat
    const newTranscription = transcription.slice(cursorRef.current);
    cursorRef.current = transcription.length;

    // Capture current highlight
    const currentHighlight = highlight || null;
    if (currentHighlight) onHighlightUsed();

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          transcription: newTranscription,
          highlight: currentHighlight,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }

      if (!assistantContent) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "(응답을 받지 못했습니다)",
          };
          return updated;
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: "0.5rem 0.75rem",
          background: "#f4f4f5",
          borderBottom: "1px solid #e4e4e7",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "#3f3f46",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "50%",
            background: "#6366f1",
          }}
        />
        AI 어시스턴트
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.6875rem",
            color: "#a1a1aa",
            fontWeight: 400,
          }}
        >
          증분 컨텍스트
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              fontSize: "0.8125rem",
              gap: "0.375rem",
            }}
          >
            <span>녹음 내용에 대해 질문하세요</span>
            <span style={{ fontSize: "0.6875rem" }}>
              텍스트를 드래그하면 특정 부분에 대해 물어볼 수 있어요
            </span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius:
                  msg.role === "user"
                    ? "0.75rem 0.75rem 0.25rem 0.75rem"
                    : "0.75rem 0.75rem 0.75rem 0.25rem",
                background: msg.role === "user" ? "#3b82f6" : "white",
                color: msg.role === "user" ? "white" : "#18181b",
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                border:
                  msg.role === "assistant" ? "1px solid #e4e4e7" : "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content || (
                <span
                  style={{ animation: "blink 0.8s step-end infinite", color: "#6366f1" }}
                >
                  ●
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "0.375rem 0.75rem",
            background: "#fef2f2",
            borderTop: "1px solid #fecaca",
            fontSize: "0.75rem",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #e4e4e7",
          background: "white",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={highlight ? `선택한 부분에 대해 질문...` : "질문을 입력하세요..."}
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "0.625rem 0.75rem",
            fontSize: "0.8125rem",
            resize: "none",
            fontFamily: "inherit",
            color: "#18181b",
            background: "transparent",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "0.625rem 1rem",
            border: "none",
            background: isLoading ? "#d4d4d8" : "#3b82f6",
            color: "white",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            borderRadius: 0,
          }}
        >
          {isLoading ? "..." : "전송"}
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
