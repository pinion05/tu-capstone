# Orchestrator scaffold

이 디렉터리는 capstone MVP의 `orchestrator` 서비스 자리다.

## 현재 상태
- Spring Boot 기반 stub API를 둔다.
- 실제 DB/스토리지 연동 전에도 프론트가 붙을 수 있게 mock 흐름을 제공한다.
- 로컬 개발 기본 포트는 `8080`이다.

## 제공 엔드포인트
- `GET /health`
- `POST /api/v1/sessions`
- `POST /api/v1/sessions/{sessionId}/audio-objects`
- `POST /api/v1/sessions/{sessionId}/jobs`
- `GET /api/v1/jobs/{jobId}`

공용 규약과 예시 요청/응답은 `../../packages/contracts/README.md`를 본다.
