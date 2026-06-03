# EduFlow 공모전 데모 환경 구축

심사위원 시연용 **완성도 높은 데모**를 위한 1회성 설정 가이드입니다.

## 데모 계정

| 역할 | 이메일 | 비밀번호 | 로그인 후 |
|------|--------|----------|-----------|
| 원장 | okto0914@gmail.com | okto0914! | `/dashboard` |
| 학부모 | okto0915@gmail.com | okto0914! | `/parent` (김민준) |
| 학생 | okto0916@gmail.com | okto0914! | `/student` (김민준) |

## 1단계: 마이그레이션

Supabase SQL Editor에서 **순서대로** 실행:

`001` → `002` → … → `014` (`supabase/migrations/`)

- `013` — 학부모/학생 이메일 연결 RLS
- `014` — 상담 카드 **대기/완료** 상태 (`consultation_status`)

## 2단계: Auth 계정 생성

**방법 A — 스크립트 (권장)**

```bash
# Dashboard → Settings → API → service_role secret 복사
set SUPABASE_SERVICE_ROLE_KEY=eyJ...
npm run demo:auth
```

**방법 B — 앱에서 가입**

1. `/auth` 에서 3계정 가입 (비밀번호 `okto0914!`)
2. `/auth/choose-role` 에서 역할 선택 (admin / parent / student)

## 3단계: 시드 데이터

SQL Editor에서 **`supabase/seed-eduflow-demo.sql`** 전체 실행.

포함 내용:

- 학원 **EduFlow Demo Academy**, 연결 코드 **EDU-DEMO-01**
- 반 **4개** (중2A·중2B·중3A·고1)
- 학생 **20명** (김민준·박서연·이도윤 스토리 + 나머지 더미)
- 최근 4주 수업 기록 + **오늘 수업 3건** + **숙제 미제출 3건** (대시보드)
- 상담 카드·학부모 리포트·연결 승인 (김민준 ↔ 0915/0916)
- 상담 카드: **김민준 = 대기**, 박서연·이도윤 = 완료 (시연용)

## 4단계: 시연 흐름 검증

| 순서 | 계정 | 확인 화면 |
|------|------|-----------|
| 1 | 원장 | Dashboard — 오늘 수업 3, 상담 권장, 숙제 미제출, 차트 |
| 2 | 원장 | Students, 학생 상세, 수업 기록 |
| 3 | 원장 | 상담 카드 — 대기/완료 배지, 상담 후 「완료 처리」 |
| 4 | 원장 | Settings — 학원 코드, 연결 요청(승인 완료 이력) |
| 5 | 학부모 | Parent Portal — 김민준 데이터 |
| 6 | 학생 | Student Portal — 김민준 데이터 |

## 학생 스토리 요약

| 학생 | 스토리 |
|------|--------|
| 김민준 | 함수 오답 반복 · 숙제 미제출 2회 · 상담 권장 |
| 박서연 | 점수 하락 · 보강 필요 |
| 이도윤 | 보강 후 점수 회복 · 회복 중 |

## 문제 해결

- **시드 실패: Auth 계정 없음** → 2단계 다시 실행
- **연결 요청 불러오기 실패** → 마이그레이션 `012` 적용 여부 확인
- **포털 빈 화면** → 시드 재실행 후 김민준 `student_connections` 확인

## 파일

- `supabase/seed-eduflow-demo.sql` — 메인 시드
- `scripts/create-demo-auth-users.mjs` — Auth 생성
- `supabase/seed-demo.sql` — 이전 발표용 (레거시, 사용 비권장)
