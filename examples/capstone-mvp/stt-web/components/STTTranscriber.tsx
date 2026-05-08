"use client";

import { useState, useRef, useEffect } from "react";
import { useSTTStream } from "@/hooks/useSTTStream";
import { useFormattingLayer } from "@/hooks/useFormattingLayer";
import { useNodeMap } from "@/hooks/useNodeMap";
import ChatPanel from "./ChatPanel";
import NodeMapView from "./NodeMapView";

interface TextFile { name: string; chars: number; }
type TabType = "raw" | "formatted";

export default function STTTranscriber() {
  const {
    finalText, interimText, displayText,
    isListening, progress, confidence, segmentCount,
    error, connect, disconnect,
  } = useSTTStream();

  const [textFiles, setTextFiles] = useState<TextFile[]>([]);
  const [selectedFile, setSelectedFile] = useState("인공지능.txt");
  const [speed, setSpeed] = useState(1);
  const [highlight, setHighlight] = useState<string | null>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const formattedRef = useRef<HTMLDivElement>(null);

  const {
    formattedText, isFormatting, processedChars, totalChars, formatError,
  } = useFormattingLayer(finalText);

  const [activeTab, setActiveTab] = useState<TabType>("raw");
  const [showNodeMap, setShowNodeMap] = useState(false);

  const {
    status: nodeMapStatus, progress: nodeMapProgress,
    nodes: nodeMapNodes, edges: nodeMapEdges,
    error: nodeMapError, generate: generateNodeMap, reset: resetNodeMap,
  } = useNodeMap(formattedText || finalText);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      setHighlight(text && text.length > 0 ? text : null);
    };
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_STT_WS_URL
        ?.replace("ws://", "http://")
        ?.replace("wss://", "https://") || "http://localhost:8765";
    fetch(`${apiUrl}/texts`)
      .then((r) => r.json())
      .then((data) => { if (data.texts) setTextFiles(data.texts); })
      .catch(() => {
        setTextFiles([
          { name: "인공지능.txt", chars: 71308 },
          { name: "기후변화.txt", chars: 71663 },
          { name: "한국역사.txt", chars: 55797 },
          { name: "로봇공학.txt", chars: 58617 },
          { name: "우주과학.txt", chars: 52452 },
          { name: "첨단기술.txt", chars: 53783 },
          { name: "한국교육.txt", chars: 52377 },
          { name: "한국경제.txt", chars: 40413 },
          { name: "한국어.txt", chars: 31408 },
          { name: "반도체.txt", chars: 29481 },
        ]);
      });
  }, []);

  useEffect(() => {
    if (displayRef.current) displayRef.current.scrollTop = displayRef.current.scrollHeight;
  }, [displayText]);

  useEffect(() => {
    if (formattedRef.current) formattedRef.current.scrollTop = formattedRef.current.scrollHeight;
  }, [formattedText]);

  return (
    <>
      {/* Node Map View */}
      {showNodeMap && nodeMapStatus === "done" && (
        <NodeMapView
          nodes={nodeMapNodes}
          edges={nodeMapEdges}
          onBack={() => { setShowNodeMap(false); resetNodeMap(); }}
        />
      )}

      {/* Node Map Loading Overlay */}
      {showNodeMap && nodeMapStatus !== "done" && nodeMapStatus !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "white", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem",
        }}>
          {nodeMapStatus === "error" ? (
            <>
              <span style={{ fontSize: "2rem" }}>⚠️</span>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "#18181b", fontWeight: 600 }}>
                노드맵 생성 실패
              </p>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#71717a" }}>
                {nodeMapError}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => generateNodeMap()} style={{
                  borderRadius: "0.375rem", padding: "0.375rem 1rem", fontSize: "0.8125rem",
                  fontWeight: 600, color: "white", border: "none", cursor: "pointer", background: "#6366f1",
                }}>재시도</button>
                <button onClick={() => { setShowNodeMap(false); resetNodeMap(); }} style={{
                  borderRadius: "0.375rem", padding: "0.375rem 1rem", fontSize: "0.8125rem",
                  fontWeight: 600, color: "#18181b", border: "1px solid #e4e4e7", cursor: "pointer", background: "white",
                }}>돌아가기</button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%", border: "3px solid #e4e4e7",
                borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#18181b" }}>
                🕸️ 지식 노드 맵 생성 중
              </p>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#71717a" }}>
                {nodeMapProgress || "처리 중..."}
              </p>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "#a1a1aa" }}>
                LLM이 트랜스크립트를 분석하여 개념과 관계를 추출합니다
              </p>
              <button onClick={() => { setShowNodeMap(false); resetNodeMap(); }} style={{
                marginTop: "1rem", borderRadius: "0.375rem", padding: "0.375rem 1rem", fontSize: "0.8125rem",
                fontWeight: 600, color: "#71717a", border: "1px solid #e4e4e7", cursor: "pointer", background: "white",
              }}>취소</button>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.625rem 1rem", background: "white",
        borderBottom: "1px solid #e4e4e7",
      }}>
        <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          disabled={isListening}
          style={{ borderRadius: "0.375rem", border: "1px solid #d4d4d8", background: "white", padding: "0.375rem 0.5rem", fontSize: "0.8125rem" }}
        >
          {textFiles.map((f) => (
            <option key={f.name} value={f.name}>{f.name} ({(f.chars / 10000).toFixed(1)}만자)</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{speed}x</span>
          <input
            type="range" min={0.1} max={1} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={isListening}
            style={{ width: "5rem", accentColor: "#3b82f6" }}
          />
        </div>

        <button
          onClick={isListening ? disconnect : () => connect({ textFile: selectedFile, speed, mode: "simulate" })}
          style={{
            borderRadius: "0.375rem", padding: "0.375rem 1rem", fontSize: "0.8125rem", fontWeight: 600,
            color: "white", border: "none", cursor: "pointer",
            background: isListening ? "#ef4444" : "#3b82f6",
          }}
        >
          {isListening ? "⏹ 중지" : "▶ 시작"}
        </button>

        {!isListening && (formattedText || finalText).length > 200 && (
          <button
            onClick={() => {
              setShowNodeMap(true);
              generateNodeMap();
            }}
            style={{
              borderRadius: "0.375rem", padding: "0.375rem 1rem", fontSize: "0.8125rem", fontWeight: 600,
              color: "white", border: "none", cursor: "pointer",
              background: "#6366f1",
            }}
          >
            🕸️ 노드맵
          </button>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.6875rem", color: "#a1a1aa" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: isListening ? "#22c55e" : "#d4d4d8", animation: isListening ? "pulse 1s infinite" : "none" }} />
            {isListening ? "수신 중" : "대기"}
          </span>
          {confidence > 0 && <span>신뢰도 {(confidence * 100).toFixed(1)}%</span>}
          {segmentCount > 0 && <span>세그먼트 {segmentCount}</span>}
          {finalText.length > 0 && <span>{finalText.length.toLocaleString()}자</span>}
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div style={{ flexShrink: 0, height: "2px", background: "#e4e4e7" }}>
          <div style={{ height: "100%", background: "#3b82f6", transition: "width 0.3s", width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}

      {/* Main split area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Transcript */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #e4e4e7", position: "relative" }}>
          {/* Highlight indicator */}
          {highlight && (
            <div style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.375rem 0.75rem", background: "#eef2ff", borderBottom: "1px solid #c7d2fe",
              fontSize: "0.75rem", color: "#4338ca",
            }}>
              <span>📌</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                &quot;{highlight.slice(0, 10)}{highlight.length > 10 ? "..." : ""}&quot;
              </span>
              <span style={{ fontSize: "0.625rem", color: "#6366f1", fontWeight: 500, whiteSpace: "nowrap" }}>
                {highlight.length}자
              </span>
              <button
                onClick={() => { setHighlight(null); window.getSelection()?.removeAllRanges(); }}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.75rem", padding: "0 0.125rem" }}
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div style={{
              flexShrink: 0, padding: "0.375rem 0.75rem", background: "#fef2f2",
              borderBottom: "1px solid #fecaca", fontSize: "0.75rem", color: "#dc2626",
            }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{
            flexShrink: 0, display: "flex", borderBottom: "1px solid #e4e4e7", background: "#fafafa",
          }}>
            <button
              onClick={() => setActiveTab("raw")}
              style={{
                padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 600,
                color: activeTab === "raw" ? "#18181b" : "#71717a",
                background: "none", border: "none", borderBottom: activeTab === "raw" ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              원본
            </button>
            <button
              onClick={() => setActiveTab("formatted")}
              style={{
                padding: "0.5rem 1rem", fontSize: "0.8125rem", fontWeight: 600,
                color: activeTab === "formatted" ? "#18181b" : "#71717a",
                background: "none", border: "none", borderBottom: activeTab === "formatted" ? "2px solid #10b981" : "2px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.375rem",
              }}
            >
              개선
              {isFormatting && (
                <span style={{
                  width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#10b981",
                  animation: "pulse 1s infinite",
                }} />
              )}
            </button>
            {activeTab === "formatted" && formattedText.length > 0 && (
              <span style={{
                marginLeft: "auto", padding: "0.5rem 1rem", fontSize: "0.6875rem", color: "#a1a1aa",
                display: "flex", alignItems: "center", gap: "0.375rem",
              }}>
                {totalChars > 0 ? `${Math.round((processedChars / totalChars) * 100)}%` : ""}
                {isFormatting && " 포매팅 중..."}
              </span>
            )}
          </div>

          {/* Format error */}
          {formatError && activeTab === "formatted" && (
            <div style={{
              flexShrink: 0, padding: "0.25rem 0.75rem", background: "#fffbeb",
              borderBottom: "1px solid #fde68a", fontSize: "0.6875rem", color: "#92400e",
            }}>
              ⚠ 포매팅 오류 — 원본 텍스트로 대체됨: {formatError}
            </div>
          )}

          {/* Raw transcript view */}
          {activeTab === "raw" && (
            <div
              ref={displayRef}
              style={{
                flex: 1, overflowY: "auto", padding: "1.25rem",
                fontSize: "0.9375rem", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "inherit",
                userSelect: "text",
              }}
            >
              {displayText ? (
                <>
                  <span style={{ color: "#18181b" }}>{finalText}</span>
                  {interimText && (
                    <span style={{ color: "#6366f1" }}>
                      {interimText}
                      <span style={{ animation: "blink 0.8s step-end infinite" }}>▎</span>
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "#a1a1aa" }}>
                  {isListening ? "수신 대기 중..." : "시작 버튼을 눌러 transcription을 시작하세요"}
                </span>
              )}
            </div>
          )}

          {/* Formatted transcript view */}
          {activeTab === "formatted" && (
            <div
              ref={formattedRef}
              style={{
                flex: 1, overflowY: "auto", padding: "1.25rem",
                fontSize: "0.9375rem", lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: "inherit",
                userSelect: "text", color: "#18181b",
              }}
            >
              {formattedText ? (
                formattedText
              ) : isFormatting ? (
                <span style={{ color: "#a1a1aa" }}>포매팅 처리 중...</span>
              ) : finalText.length > 0 ? (
                <span style={{ color: "#a1a1aa" }}>포매팅이 곧 시작됩니다...</span>
              ) : (
                <span style={{ color: "#a1a1aa" }}>
                  {isListening ? "수신 대기 중..." : "시작 버튼을 눌러 transcription을 시작하세요"}
                </span>
              )}
              {isFormatting && formattedText.length > 0 && (
                <span style={{ animation: "blink 0.8s step-end infinite", color: "#10b981" }}>▎</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div style={{ width: "380px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <ChatPanel transcription={displayText} highlight={highlight} onHighlightUsed={() => setHighlight(null)} />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
