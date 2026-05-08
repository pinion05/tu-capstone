# LLM 포매팅 레이어 MVP 스펙

## 메타데이터
- 브랜치: feat/llm-formatting-layer
- 프로젝트: capstone-mvp (brownfield)
- 최종 모호성: 16.5%
- 상태: READY

## 목표

STT 트랜스크립트에 LLM 기반 포매팅 레이어를 추가하여, 읽기 어려운 긴 문자열을 문단 단위로 줄바꿈된 깔끔한 텍스트로 변환한다.

## 핵심 설계

### 청킹 방식
- LLM이 **2000글자** 단위로 텍스트를 받음
- LLM이 **스스로 처리 경계를 결정** (문장 끝, 의미 구분점 등)
- 예: 2000글자를 받고 1763번 글자까지 처리하겠다고 판단 → 커서를 1763으로 이동
- 다음 청크는 1763번부터 2000글자를 받아 반복

### 비동기 처리
- 스트리밍은 원본 탭에 계속 실시간 표시
- LLM 포매팅은 백그라운드에서 비동기 처리
- 개선 탭은 LLM 처리 완료된 구간만 점진적으로 표시
- 청크 크기는 항상 2000글자 고정 (스트리밍이 앞서도 커서만 따라감)

### LLM 작업 (MVP)
- **문단 단위 줄바꿈**만 수행
- 기준: 주제/의미가 바뀌는 지점에서 줄바꿈
- V2에서 추가 예정: 오타 수정, 마크다운 포맷팅, 정보 보충

### UI
- 탭 전환: **원본** | **개선**
- 원본 탭: 실시간 스트리밍 그대로 표시 (기존 동작)
- 개선 탭: LLM 처리 완료된 구간만 표시, 미처리 구간은 표시하지 않음

## 제약
- 청크 크기: 2000글자 고정
- LLM: OpenRouter (qwen/qwen3.5-flash) 기존 키 재사용
- MVP는 줄바꿈만, 나머지는 V2

## 비목표 (V2)
- 오타 수정 (STT 오인식 교정)
- 마크다운 포맷팅 (제목, 볼드 등)
- 정보 누락 보충

## 수용 기준
- [ ] 원본/개선 탭 전환 동작
- [ ] LLM이 2000글자 청크를 받아 문단 단위 줄바꿈
- [ ] LLM이 스스로 처리 경계를 결정하고 커서를 반환
- [ ] 개선 탭에 처리 완료된 구간이 점진적으로 표시
- [ ] 스트리밍 중에도 백그라운드에서 포매팅 계속 처리
- [ ] 처리 실패 시 해당 청크를 스킵하고 다음 청크로 진행

## 기술 컨텍스트

### 기존 구조
```
stt-web/
├── components/
│   ├── STTTranscriber.tsx  ← 메인 컴포넌트 (좌측 트랜스크립트)
│   └── ChatPanel.tsx       ← 우측 채팅
├── hooks/
│   └── useSTTStream.ts     ← WebSocket 스트리밍 훅
├── app/api/chat/route.ts   ← OpenRouter 챗 API
└── app/stt/page.tsx        ← 페이지
```

### 추가 필요
```
stt-web/
├── app/api/format/route.ts     ← LLM 포매팅 API (새 청크 요청)
├── hooks/useFormattingLayer.ts  ← 포매팅 레이어 훅 (큐, 커서, 상태 관리)
└── components/FormattedTranscript.tsx  ← 탭 전환 UI
```

### API 명세 (POST /api/format)

요청:
```json
{
  "text": "2000글자 텍스트",
  "cursor": 0
}
```

응답:
```json
{
  "formatted": "문단 단위로 줄바꿈된 텍스트",
  "new_cursor": 1763,
  "processed_chars": 1763
}
```

### 포매팅 레이어 시스템 프롬프트

```
너는 음성 인식(STT) 트랜스크립트를 읽기 좋게 포매팅하는 에이전트야.

규칙:
1. 아래 텍스트를 문단 단위로 줄바꿈해
2. 의미가 바뀌는 지점에서 줄바꿈
3. 너무 긴 문단은 적절히 나눠
4. 내용은 절대 변경하지 마 (줄바꿈만 추가)
5. 처리할 수 있는 범위를 판단해서 정확히 그 지점까지 처리해

출력 형식 (JSON):
{
  "formatted": "줄바꿈된 텍스트",
  "processed_chars": 처리한 글자 수
}

=== 텍스트 ===
{text}
=== 끝 ===
```

### 온톨로지

| 엔티티 | 타입 | 필드 | 관계 |
|--------|------|------|------|
| RawTranscript | data | text, length | FormattingLayer가 소비 |
| FormattingLayer | service | cursor, queue, status | RawTranscript → FormattedTranscript |
| FormatChunk | data | raw, formatted, start, end | FormattingLayer가 생성 |
| Cursor | state | position | FormattingLayer가 관리 |
| TabView | ui | activeTab: "raw" \| "formatted" | 사용자가 전환 |

## 인터뷰 요약

| Round | 타겟 | 결정 |
|-------|------|------|
| 1 | Goal | LLM이 트랜스크립트를 포매팅하는 에이전트 |
| 2 | Constraints | 2000글자 청크, LLM이 자율 경계 결정, 커서 방식 |
| 3 | Success Criteria | 원본/개선 탭 전환 |
| 4 | Constraints | 청크 크기 2000글자 고정, 백그라운드 비동기 |
| 5 | Success Criteria | MVP는 줄바꿈만 |
| 6 | Success Criteria | 문단 단위 줄바꿈 (주제/의미 기준) |
