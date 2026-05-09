# Web app scaffold

이 디렉터리는 capstone MVP의 `web` 서비스 자리다.

## 현재 상태
- Next.js 기본 앱을 `apps/web` 서비스 이름으로 이동했다.
- 실제 화면 기능은 각자 병렬 개발하면서 채운다.
- 로컬 개발 기본 포트는 `3000`이다.

## 로컬 실행
```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

## 연결 대상
- orchestrator: `http://localhost:8080`
- agent-worker: `http://localhost:8765`

공용 규약과 예시 요청/응답은 `../../packages/contracts/README.md`를 본다.
