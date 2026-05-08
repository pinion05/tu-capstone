"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

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

interface GraphData {
  nodes: (Node & { id: string })[];
  links: { source: string | Node; target: string | Node; label: string }[];
}

interface NodeMapViewProps {
  nodes: Node[];
  edges: Edge[];
  onBack: () => void;
}

const IMPORTANCE_COLOR: Record<string, string> = {
  high: "#3b82f6",
  medium: "#6366f1",
  low: "#a5b4fc",
};

const IMPORTANCE_SIZE: Record<string, number> = {
  high: 20,
  medium: 14,
  low: 10,
};

function getLinkMidpoint(link: any): { x: number; y: number } {
  const sx = typeof link.source === "object" ? link.source.x : 0;
  const sy = typeof link.source === "object" ? link.source.y : 0;
  const tx = typeof link.target === "object" ? link.target.x : 0;
  const ty = typeof link.target === "object" ? link.target.y : 0;
  return { x: (sx + tx) / 2, y: (sy + ty) / 2 };
}

export default function NodeMapView({ nodes, edges, onBack }: NodeMapViewProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const graphRef = useRef<any>(null);

  const graphData: GraphData = {
    nodes: nodes.map((n) => ({ ...n, id: n.name })),
    links: edges.map((e) => ({ source: e.from, target: e.to, label: e.relation })),
  };

  const connectedNodes = useCallback(
    (nodeName: string): string[] => {
      const connected = new Set<string>();
      edges.forEach((e) => {
        if (e.from === nodeName) connected.add(e.to);
        if (e.to === nodeName) connected.add(e.from);
      });
      return Array.from(connected);
    },
    [edges]
  );

  useEffect(() => {
    // Center graph after render
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.centerAt(0, 0, 0);
        graphRef.current.zoom(1.5, 0);
      }
    }, 500);
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.625rem 1rem",
          background: "white",
          borderBottom: "1px solid #e4e4e7",
        }}
      >
        <button
          onClick={onBack}
          style={{
            borderRadius: "0.375rem",
            padding: "0.375rem 0.75rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#3b82f6",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            cursor: "pointer",
          }}
        >
          ← 돌아가기
        </button>

        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18181b" }}>
          🕸️ 지식 노드 맵
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", fontSize: "0.6875rem", color: "#71717a" }}>
          <span>노드 {nodes.length}개</span>
          <span>관계 {edges.length}개</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: IMPORTANCE_COLOR.high }} />
            핵심
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: IMPORTANCE_COLOR.medium }} />
            중간
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: IMPORTANCE_COLOR.low }} />
            보조
          </span>
        </div>
      </div>

      {/* Graph + Detail panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Graph area */}
          <div style={{ flex: 1, background: "#fafafa", position: "relative" }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel="name"
              nodeVal={(node: any) => IMPORTANCE_SIZE[node.importance] || 10}
              nodeColor={(node: any) => IMPORTANCE_COLOR[node.importance] || "#a5b4fc"}
              nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
                const label = node.name;
                const size = IMPORTANCE_SIZE[node.importance] || 10;

                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                ctx.fillStyle = IMPORTANCE_COLOR[node.importance] || "#a5b4fc";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                const tagFontSize = Math.max(10 / globalScale, 3);
                ctx.font = `600 ${tagFontSize}px Sans-Serif`;
                const tagWidth = ctx.measureText(label).width;
                ctx.fillStyle = "#18181b";
                ctx.fillText(label, node.x - tagWidth / 2, node.y + size + tagFontSize + 2 / globalScale);
              }}
              linkLabel="label"
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={0.8}
              linkColor="#c7d2fe"
              linkWidth={1.5}
              linkCanvasObjectMode={() => "after"}
              linkCanvasObject={(link: any, ctx: any, globalScale: any) => {
                const fontSize = Math.max(8 / globalScale, 2.5);
                ctx.font = `${fontSize}px Sans-Serif`;
                const { x, y } = getLinkMidpoint(link);
                ctx.fillStyle = "#6366f1";
                ctx.textAlign = "center";
                ctx.fillText(link.label || "", x, y - 4 / globalScale);
              }}
              onNodeClick={(node: any) => setSelectedNode(node as Node)}
              onBackgroundClick={() => setSelectedNode(null)}
              cooldownTicks={100}
              warmupTicks={30}
            />
          </div>

        {/* Detail panel */}
        {selectedNode && (
          <div
            style={{
              width: "280px",
              flexShrink: 0,
              background: "white",
              borderLeft: "1px solid #e4e4e7",
              padding: "1rem",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#18181b" }}>
                {selectedNode.name}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "none", border: "none", color: "#a1a1aa", cursor: "pointer",
                  fontSize: "1rem", padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  background: `${IMPORTANCE_COLOR[selectedNode.importance]}20`,
                  color: IMPORTANCE_COLOR[selectedNode.importance],
                }}
              >
                {selectedNode.importance === "high" ? "핵심" : selectedNode.importance === "medium" ? "중간" : "보조"}
              </span>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.6, color: "#52525b" }}>
                {selectedNode.summary}
              </p>
            </div>

            {connectedNodes(selectedNode.name).length > 0 && (
              <div>
                <p style={{ margin: "0 0 0.375rem", fontSize: "0.6875rem", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase" }}>
                  연결된 노드
                </p>
                {connectedNodes(selectedNode.name).map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      const found = nodes.find((n) => n.name === name);
                      if (found) setSelectedNode(found);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.375rem 0.5rem",
                      marginBottom: "0.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e4e4e7",
                      background: "#fafafa",
                      fontSize: "0.8125rem",
                      color: "#18181b",
                      cursor: "pointer",
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
