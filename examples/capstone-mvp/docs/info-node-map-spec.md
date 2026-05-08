# 정보 노드 맵 (Info Node Map) 스펙

## 메타데이터
- 브랜치: feat/info-node-map
- 프로젝트: capstone-mvp (brownfield)
- 최종 모호성: 12.6%
- 상태: READY

## 목표

강의 종료 버튼 클릭 시, LLM 기반 3단 레이어를 거쳐 트랜스크립트에서 핵심 개념/용어와 그 관계를 추출하고, 인터랙티브 그래프뷰로 시각화한다.

## 핵심 설계

### 트리거
- 강의 종료 버튼 클릭
- 포매팅된 트랜스크립트(또는 원본)를 입력으로 사용

### 3단 레이어 구조

#### 레이어 1: 의미 기반 청킹
- 기존 문단 단위 청킹을 활용 (포매팅 레이어에서 이미 문단 단위로 분리됨)
- 별도 LLM 호출 없이 클라이언트에서 `\n\n` 기준으로 분할
- 청킹 생략 가능 (이미 문단 구조가 있으면 그대로 사용)

#### 레이어 2: 노드 기반 변환
- 각 청크를 독립적으로 LLM에 전달하여 노드맵 생성
- 청크당 하나의 독립적인 노드맵이 생성됨
- 여러 청크에서 중복 개념, 모순 정보가 포함될 수 있음 (의도됨 — 레이어 3에서 해결)
- LLM 입력: 청크 텍스트
- LLM 출력: `{ nodes: [...], edges: [...] }` JSON

#### 레이어 3: 순차 병합
- 레이어 2에서 생성된 N개의 독립 노드맵을 순차적으로 병합
- 병합 순서: `(1,2) 통합 → 통합본과 3 통합 → 통합본과 4 통합 → ...`
- 매 병합 시 LLM이 중복/모순을 판단하고 해결

### 병합 규칙 (LLM 프롬프트에 명시)

| 상황 | 규칙 |
|------|------|
| 동일 개념 | 하나로 병합 (예: "신경망" + "인공신경망" → "인공신경망") |
| 중복 관계 | 하나로 합치기 |
| 모순 정보 | AND로 결합 (예: "CNN은 이미지 처리용" + "CNN은 자연어 처리용" → "CNN은 이미지 처리용이며 자연어 처리에도 사용됨") |
| 중요도 충돌 | 가중평균 (청크 번호를 가중치로 사용하거나 단순 평균) |

## 데이터 모델

### 노드 (Node)
```typescript
interface Node {
  name: string;        // 개념/용어 이름
  type: "concept";     // MVP는 concept만
  summary: string;     // 1~2문장 요약
  importance: "high" | "medium" | "low";  // 중요도
}
```

### 엣지 (Edge)
```typescript
interface Edge {
  from: string;        // 출발 노드 이름
  to: string;          // 도착 노드 이름
  relation: string;    // 관계 설명 (예: "포함", "사용", "기반")
}
```

### 노드맵 (NodeMap)
```typescript
interface NodeMap {
  nodes: Node[];
  edges: Edge[];
}
```

## UI 설계

### 진행 화면
- 강의 종료 버튼 클릭 → 로딩 화면으로 전환
- 진행률 표시: 레이어별 진행 상태
  - "레이어 2: 노드 추출 중... (3/10 청크)"
  - "레이어 3: 병합 중... (2/9)"
- 백엔드에서 SSE 또는 폴링으로 진행률 전달

### 그래프뷰
- 완료되면 인터랙티브 그래프뷰로 전환
- 라이브러리 사용 (안정성 확보, e.g. react-force-graph, reactflow, d3-force)
- 드래그/줌 가능
- 노드 크기/색상으로 중요도 시각화
  - high: 크고 진한 색
  - medium: 기본
  - low: 작고 연한 색

### 노드 상세 패널
- 노드 클릭 시 표시:
  - 이름
  - 요약 (summary)
  - 중요도
  - 연결된 노드 목록

### 세션 관리
- 노드맵은 메모리/React 상태만 유지
- 페이지 새로고침 시 사라짐 (DB 저장 없음)
- 영속화는 V2에서 고려

## API 설계

### POST /api/extract-nodes
레이어 2: 단일 청크 → 노드맵 변환

요청:
```json
{
  "chunk": "인공지능은 인간의 지능을...",
  "chunkIndex": 0
}
```

응답:
```json
{
  "nodes": [
    { "name": "인공지능", "type": "concept", "summary": "인간 지능을 컴퓨터로 구현", "importance": "high" }
  ],
  "edges": [
    { "from": "인공지능", "to": "기계학습", "relation": "기반 기술" }
  ]
}
```

### POST /api/merge-nodes
레이어 3: 두 노드맵 병합

요청:
```json
{
  "mapA": { "nodes": [...], "edges": [...] },
  "mapB": { "nodes": [...], "edges": [...] }
}
```

응답:
```json
{
  "merged": {
    "nodes": [...],
    "edges": [...]
  },
  "stats": {
    "nodesBefore": 15,
    "nodesAfter": 10,
    "edgesBefore": 12,
    "edgesAfter": 8,
    "merged": 3,
    "contradictionsResolved": 1
  }
}
```

### POST /api/generate-map
전체 파이프라인 실행 (래퍼)

요청:
```json
{
  "text": "전체 트랜스크립트 텍스트...",
  "chunks": ["청크1", "청크2", ...]
}
```

응답: SSE 스트림으로 진행률 전달, 최종 노드맵 반환

## 기술 스택

### 프론트엔드
- 그래프 라이브러리: react-force-graph-2d 또는 reactflow (선택 필요)
- 상태 관리: React useState (세션만 유지)

### 백엔드
- LLM: zai/glm-5-turbo (기존과 동일)
- API: Next.js API Routes

### 제약사항
- LLM 모델: glm-5-turbo (zai provider, 기존 포매팅/채팅과 동일)
- API URL/키: 기존 환경변수 재사용 (LLM_API_URL, LLM_API_KEY, LLM_MODEL)
