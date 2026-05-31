# Database & ORM (PostgreSQL & Spring Data JPA)

* **DB 설계:** PostgreSQL을 기반으로 한 관계형 데이터베이스 테이블 및 연관관계 명세.
* **ORM 매핑:** Spring Data JPA를 활용한 객체 지향적 Entity 설계 및 도메인 모델 구현.
* **성능 최적화 (N+1 방어):** 모든 연관관계를 지연 로딩(`FetchType.LAZY`)으로 설정하고, 다중 데이터 조회 시 `Fetch Join`을 적극 활용하여 쿼리 폭발 현상(N+1 문제) 사전 차단.

// ==========================================
// 1. 회원 및 인증 (JWT & OAuth2)
// ==========================================

Table users {
id bigint [primary key]
email varchar [unique, note: '구글 이메일 (중복가입 방지)']
name varchar [note: '사용자 이름']
picture varchar [note: '프로필 이미지 URL']
provider varchar [note: '소셜 제공자 (ex: google)']
provider_id varchar [unique, note: '구글 고유 식별값(sub)']
role varchar [note: '사용자 권한 (ROLE_USER, ROLE_ADMIN)']
created_at timestamp
updated_at timestamp
}

// ⭐ Refresh Token 관리 테이블 (PostgreSQL 저장)
Table refresh_tokens {
id bigint [primary key]
user_id bigint [note: '어떤 유저의 토큰인지']
token varchar [unique, note: '실제 Refresh Token 문자열']
user_agent varchar [note: '접속 환경 (다중 기기 관리용)']
expires_at timestamp [note: '토큰 만료 시간']
created_at timestamp
}

// ==========================================
// 2. 서비스 비즈니스 (강의 및 기록)
// ==========================================

Table lectures {
id bigint [primary key]
user_id bigint [note: '강의를 생성한 유저 ID']
title varchar [note: '강의/세션 제목']
created_at timestamp
}

Table records {
id bigint [primary key]
lecture_id bigint [unique, note: '어떤 강의의 기록인지 (1:1 관계)']
s3_audio_path varchar [note: '원본 음성 파일 S3 경로']
summary text [note: 'AI가 요약한 내용']
keywords varchar [note: '추출된 주요 키워드 (콤마 분리 등)']
duration int [note: '전체 녹음 시간(초)']
created_at timestamp
}

Table messages {
id bigint [primary key]
record_id bigint [note: '어떤 녹음본에 포함된 메시지인지']
content text [note: '텍스트 내용 (STT 결과 또는 AI 응답)']
is_agent boolean [note: 'AI 발화 여부']
s3_transcript_path varchar [note: '자막 파일 S3 경로 (필요 시)']
created_at timestamp
}

// ==========================================
// 3. 테이블 간의 관계 (Relationships)
// ==========================================

Ref: users.id < refresh_tokens.user_id
Ref: users.id < lectures.user_id
Ref: lectures.id - records.lecture_id
Ref: records.id < messages.record_id
