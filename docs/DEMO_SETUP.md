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

`001` → `002` → … → `018` (`supabase/migrations/`)

- `016` — Agent 로그·위험 신호 (`student_risk_signals`, `agent_logs`)
- `017` — Vector RAG (`student_memory_chunks`, pgvector RPC) + `agent_jobs` 워크플로
- `018` — 학부모 Vector RAG 읽기 RLS

## 2단계: Auth 계정 생성

**방법 A — 스크립트 (권장)**

```bash
set SUPABASE_SERVICE_ROLE_KEY=eyJ...
npm run demo:auth
```

**방법 B — 앱에서 가입**

1. `/auth` 에서 3계정 가입 (비밀번호 `okto0914!`)
2. `/auth/choose-role` 에서 역할 선택 (admin / parent / student)

## 3단계: 시드 데이터

SQL Editor에서 **`supabase/seed-eduflow-demo.sql`** 전체 실행.

포함 내용:

- 학원 **해성수학전문학원**, 연결 코드 **HAESUNG-26**
- 반 **6개** (중1A·중2A·중2B·중3A·중3B·고1)
- 학생 **40명** (실제 학교명·6주 수업기록·전문 메모)
- **오늘 수업** 전원 기록, 숙제 미제출·상담 권장 학생 다수
- 상담 카드·학부모 리포트·후속 과제
- **Agent 데모**: `student_risk_signals`, `agent_logs`, `agent_jobs`
- **Vector RAG**: 김민준 `student_memory_chunks` (텍스트, embedding은 `POST /api/rag/index-student`로 생성)
- 연결: 김민준 ↔ 0915/0916

## 4단계: 시연 흐름 검증

| 순서 | 계정 | 확인 화면 |
|------|------|-----------|
| 1 | 원장 | Dashboard — Proactive 배너, Workflow, Action Feed |
| 2 | 원장 | AI Action Center — 상담·보강·연락 검토 학생 |
| 3 | 원장 | 학생 상세 — 김민준·황태민 스토리 |
| 4 | 원장 | 상담 카드 — 대기/완료, Agent 초안 문구 |
| 5 | 학부모 | Parent Portal — 김민준 AI + 「답변에 사용된 기록」 |
| 6 | (선택) | `POST /api/rag/index-student` 로 Vector 인덱싱 |

## 학생 스토리 요약

| 학생 | 반 | 스토리 |
|------|-----|--------|
| 김민준 | 중2A | 함수·그래프 오답 반복 · 숙제 미제출 · 상담 권장 · Workflow 완료 |
| 박서연 | 중2A | 88→62 하락 · 보강 권장 |
| 황태민 | 중3A | 인수분해 4주 정체 · Parent Agent 진행 중 |
| 서동현 | 중3A | 결석·기하 취약 · Counseling 진행 중 |
| 이도윤 | 중3A | 보강 후 52→82 회복 |
| 기타 | — | 35명 5주 기록 + Risk 분류 |

## 문제 해결

- **시드 실패: Auth 계정 없음** → 2단계 다시 실행
- **Vector 검색 안 됨** → `GEMINI_API_KEY` 설정 후 `index-student` 호출
- **포털 빈 화면** → 시드 재실행 후 김민준 `student_connections` 확인

## 파일

- `supabase/seed-eduflow-demo.sql` — 메인 시드
- `scripts/create-demo-auth-users.mjs` — Auth 생성
