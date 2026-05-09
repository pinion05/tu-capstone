# MVP 공용 계약 초안

이 문서는 **웹·스프링·파이썬 병렬 개발용 초기 스캐폴딩**에서 먼저 고정하는 최소 공용 규칙만 다룬다.

운영 배포 규약이 아니라, 당분간 각자 개발하다가 나중에 붙일 때 충돌을 줄이기 위한 **개발용 바닥 계약**이다.

## 서비스 이름
- `web`
- `orchestrator`
- `agent-worker`

## 기본 포트
- `web`: `3000`
- `orchestrator`: `8080`
- `agent-worker`: `8765`
- `postgres`: `5432`
- `minio api`: `9000`
- `minio console`: `9001`
- `redis`: `6379`

## 공용 환경 변수 이름
compose 기준으로 아래 `*_PORT` 값은 **호스트에 publish하는 포트**를 조정하는 변수다.

- `WEB_PORT`
- `ORCHESTRATOR_PORT`
- `AGENT_WORKER_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_API_PORT`
- `MINIO_CONSOLE_PORT`
- `REDIS_PORT`

## /health 규약
`orchestrator`, `agent-worker`는 최소한 아래 JSON 모양을 맞춘다.

```json
{
  "service": "orchestrator",
  "status": "ok",
  "version": "dev-scaffold"
}
```

규칙:
- `GET /health`
- HTTP 200이면 살아있다고 본다.
- `service`는 고정 서비스 이름을 쓴다.
- `status`는 현재 `ok`만 사용한다.
- `version`은 초기 스캐폴딩 단계에서는 `dev-scaffold`로 둔다.

## 최소 공용 필드
- `sessionId`: 세션 식별자. 예: `ses_7f0d2e9f88ab`
- `jobId`: 변환 작업 식별자. 예: `job_320c4a4cb708`
- `objectKey`: 오디오/산출물 저장 키. 예: `sessions/ses_xxx/audio/1715343000000-audio.wav`
- `status`: 현재 상태. 초기에는 `created`, `registered`, `completed`를 사용한다.

## 최소 흐름 1개
흐름:
1. 세션 생성
2. 오디오 업로드/등록
3. 변환 작업 요청
4. 결과 조회/반환

### 1) 세션 생성
`POST /api/v1/sessions`

요청 예시:
```json
{
  "source": "web"
}
```

응답 예시:
```json
{
  "sessionId": "ses_7f0d2e9f88ab",
  "status": "created",
  "createdAt": "2026-05-10T01:30:00Z",
  "source": "web",
  "nextUploadPath": "/api/v1/sessions/ses_7f0d2e9f88ab/audio-objects"
}
```

### 2) 오디오 업로드/등록
초기 스캐폴딩 단계에서는 **실제 바이너리 업로드 대신 object metadata 등록**만 먼저 맞춘다.
추후 MinIO presign/upload로 바뀌어도 `sessionId`, `objectKey`, `status` 축은 유지한다.

`POST /api/v1/sessions/{sessionId}/audio-objects`

요청 예시:
```json
{
  "fileName": "lecture-01.wav",
  "contentType": "audio/wav",
  "sizeBytes": 245760,
  "objectKey": "sessions/ses_7f0d2e9f88ab/audio/lecture-01.wav"
}
```

응답 예시:
```json
{
  "sessionId": "ses_7f0d2e9f88ab",
  "objectKey": "sessions/ses_7f0d2e9f88ab/audio/lecture-01.wav",
  "status": "registered",
  "contentType": "audio/wav",
  "sizeBytes": 245760
}
```

### 3) 변환 작업 요청
`POST /api/v1/sessions/{sessionId}/jobs`

요청 예시:
```json
{
  "objectKey": "sessions/ses_7f0d2e9f88ab/audio/lecture-01.wav"
}
```

응답 예시:
```json
{
  "jobId": "job_320c4a4cb708",
  "sessionId": "ses_7f0d2e9f88ab",
  "objectKey": "sessions/ses_7f0d2e9f88ab/audio/lecture-01.wav",
  "status": "completed",
  "workerService": "agent-worker",
  "pollPath": "/api/v1/jobs/job_320c4a4cb708"
}
```

### 4) 결과 조회/반환
`GET /api/v1/jobs/{jobId}`

응답 예시:
```json
{
  "jobId": "job_320c4a4cb708",
  "sessionId": "ses_7f0d2e9f88ab",
  "objectKey": "sessions/ses_7f0d2e9f88ab/audio/lecture-01.wav",
  "status": "completed",
  "workerService": "agent-worker",
  "transcript": "이 응답은 개발용 초기 스캐폴딩에서 반환하는 mock transcript 입니다.",
  "completedAt": "2026-05-10T01:31:00Z",
  "metadata": {
    "mode": "stub"
  }
}
```

## mock / stub 기준
- `orchestrator`는 실제 DB/스토리지/워커 연동 전에도 위 흐름을 stub으로 반환할 수 있어야 한다.
- `agent-worker`는 실제 AI 파이프라인 전에도 websocket/mock STT 진입점을 유지한다.
- `web`은 실제 서비스가 완성되기 전까지 이 계약만 맞춰도 화면 개발을 진행할 수 있다.

## 레이어를 나누는 이유
- `infra`: 같이 띄우는 개발 환경
- `packages/contracts`: 서비스끼리 맞춰야 하는 공용 약속
- `apps/*`: 각 서비스 구현

즉, 실행 환경 / 공용 약속 / 서비스 구현을 분리해서 병렬 개발 충돌을 줄인다.
