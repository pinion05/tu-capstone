# tu-capstone

이 저장소는 **웹·스프링·파이썬 병렬 개발용 MVP 초기 스캐폴딩**을 담는다.

핵심 목표는 초기에 과설계하지 않으면서도,
나중에 합칠 때 충돌이 크게 나지 않도록 **서비스 경계 / 공용 계약 / 로컬 개발 환경**만 먼저 고정하는 것이다.

## 현재 구조
```text
apps/
  web/
  orchestrator/
  agent-worker/
infra/
  compose.yaml
  .env.example
packages/
  contracts/
```

## 레이어 역할
- `apps/*`: 각 서비스 구현
- `infra`: 같이 띄우는 개발 환경
- `packages/contracts`: 서비스끼리 맞춰야 하는 공용 규약

## 포함 서비스
- `web`: Next.js 기반 프론트 자리
- `orchestrator`: Spring Boot 기반 API/stub 오케스트레이터
- `agent-worker`: FastAPI 기반 mock STT worker
- `postgres`: 로컬 영속 저장소
- `minio`: 로컬 오브젝트 스토리지
- `redis`: worker/AI 확장용 선택 의존성

## 빠른 시작
```bash
cp infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/compose.yaml up
```

기본 접속 포트:
- web: `http://localhost:3000`
- orchestrator: `http://localhost:8080/health`
- agent-worker: `http://localhost:8765/health`
- minio console: `http://localhost:9001`

## 문서
- 공용 계약 / 요청응답 예시: `packages/contracts/README.md`
- 기존 MSA 구상 문서: `docs/msa-instance-architecture.md`

## 범위 주의
이 작업은 **개발용 초기 스캐폴딩**이다.

아직 포함하지 않는 것:
- 인증 / 권한 모델
- production 배포 설정
- 실제 AI agent 실행 파이프라인
- message broker 도입
- MSA 세분화 / multi-replica 확장
