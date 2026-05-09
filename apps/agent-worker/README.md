# Agent worker scaffold

이 디렉터리는 capstone MVP의 `agent-worker` 서비스 자리다.

## 현재 상태
- 기존 `examples/capstone-mvp/stt-server` 구조를 가져와 정리한 FastAPI mock worker다.
- 실시간 STT websocket mock과 `/health`를 제공한다.
- 로컬 개발 기본 포트는 `8765`다.
- Redis는 현재 공용 필수가 아니라, worker/AI 쪽 확장용 의존성으로만 둔다.

## 제공 엔드포인트
- `GET /`
- `GET /health`
- `GET /texts`
- `WS /stt/stream`
- `WS /stt/simulate`

공용 규약과 예시 요청/응답은 `../../packages/contracts/README.md`를 본다.
