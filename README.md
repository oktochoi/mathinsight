# EduFlow 사용 가이드

**EduFlow**는 학생 흐름 데이터를 기반으로 교육 운영을 자동화하는 AI Workflow Platform입니다.  
현재 파일럿은 수학학원 **원장·강사**, **학부모**, **학생**이 각각 다른 화면을 사용하는 기록·상담·리포트 흐름을 제공합니다.

> 제품 비전·로드맵: [docs/EDUFLOW.md](./docs/EDUFLOW.md)  
> **운영자가 할 일:** [docs/YOUR_TASKS.md](./docs/YOUR_TASKS.md)

---

## 로그인 및 회원가입

### 회원가입

[`/signup`](http://localhost:3000/signup)

회원가입 시 역할을 선택합니다.

- **원장/강사** — 학원 이름 입력, 학원·기본 반 자동 생성
- **학부모** — 자녀 학습 현황 조회
- **학생** — 본인 학습 기록 조회

가입 시 선택한 역할과 **동일한 역할**로 로그인해야 합니다.

### 로그인

[`/login`](http://localhost:3000/login)

| 역할 | 로그인 후 이동 |
|------|----------------|
| 원장/강사 | `/dashboard` |
| 학부모 | `/parent` |
| 학생 | `/student` |

---

## 원장/강사 사용 흐름

### 1. 학원 시작 세팅

#### 반 만들기

**메뉴:** `Students`

상단 **「반 이름 추가·수정」**에서 반을 추가합니다.

예시:

- 중2 A반
- 중2 B반
- 고1 심화반

### 2. 학생 등록

**Students** → **학생 등록**

| 항목 | 설명 |
|------|------|
| 학생 이름 | 필수 |
| 학년 | 중1~고3 등 |
| 학교 | 선택 |
| 반 | 위에서 만든 반 선택 |
| 학부모 이메일 | 학부모 회원가입 이메일과 **동일**하게 |
| 학생 이메일 | 학생 회원가입 이메일과 **동일**하게 |

이메일은 학생 정보에 저장되며, 해당 역할로 가입한 계정이 있으면 **자동 연결(✓)** 됩니다.

### 3. 수업 기록 입력

**메뉴:** `Lesson Logs`

수업 후 입력:

- 출석 (출석 / 지각 / 결석)
- 숙제 (완료 / 부분 / 미제출)
- 시험 점수
- 단원
- 태그·메모 (특이사항)

**예시**

| 항목 | 값 |
|------|-----|
| 출석 | 출석 |
| 숙제 | 완료 |
| 점수 | 85 |
| 단원 | 일차방정식 |
| 태그 | 계산 실수 |

입력된 데이터는 **Dashboard**, **학생 상세**, **상담 카드**, **학부모/학생 페이지**에 반영됩니다.

---

## Dashboard

학원 전체 흐름을 확인합니다.

- 오늘 수업 수
- 숙제 미제출 학생
- 상담 추천 학생
- 최근 점수 하락 학생
- 최근 리포트

---

## Students

학생 및 반을 관리합니다.

- 학생 등록·수정·삭제
- 반 추가·수정·삭제
- **학생별 보기** — 한 명씩 차트·기록 확인
- 학부모/학생 계정 연결 (이메일)

목록 **연결** 열: `부모 ✓` · `학생 ✓` 이면 포털 로그인 가능

---

## 학생 상세 페이지

`/students/[학생ID]` — 학생 한 명의 흐름을 확인합니다.

- 최근 점수 변화
- 숙제 흐름
- 최근 수업 기록
- 최근 단원·태그
- 학습 요약
- 학부모/학생 포털 연결 상태

상담 전 학생 상태를 빠르게 파악할 수 있습니다.

---

## Consultation Cards

상담용 요약 카드를 생성합니다.

- 최근 학습 흐름
- 점수·숙제 근거
- 상담 포인트
- 학부모 전달 문장

학부모 상담 전에 빠르게 확인할 수 있습니다.

---

## Parent Reports

학부모 전달용 리포트를 생성합니다.

- 최근 학습 단원
- 숙제·점수 흐름
- 관리 포인트
- 다음 학습 방향

**톤 선택:** 친절형 · 객관형 · 입시형 · 칭찬형

---

## 학부모 사용 흐름

### 1. 회원가입

[`/signup`](http://localhost:3000/signup) → 역할 **학부모**

가입 이메일은 원장이 학생 정보에 입력한 **학부모 이메일과 동일**해야 합니다.

### 2. 로그인

[`/login`](http://localhost:3000/login) → 역할 **학부모** → [`/parent`](http://localhost:3000/parent)

### 학부모 페이지에서 확인 가능

- 자녀 최근 점수·숙제 흐름
- 최근 수업
- 학부모 리포트
- 학습 요약

---

## 학생 사용 흐름

### 1. 회원가입

[`/signup`](http://localhost:3000/signup) → 역할 **학생**

가입 이메일은 원장이 학생 정보에 입력한 **학생 이메일과 동일**해야 합니다.

### 2. 로그인

[`/login`](http://localhost:3000/login) → 역할 **학생** → [`/student`](http://localhost:3000/student)

### 학생 페이지에서 확인 가능

- 오늘 수업·과제
- 최근 점수
- 최근 피드백
- 최근 수업 목록

---

## 연결 방법 (학부모·학생)

```
① 학부모·학생 각각 /signup 으로 회원가입
② 원장: Students → 학생 수정 → 동일 이메일 입력 → 저장
③ 목록에서 부모 ✓ · 학생 ✓ 확인
④ 학부모 /parent · 학생 /student 로그인
```

연결이 안 되면: 이메일 오타, 역할 불일치, Supabase **007** 마이그레이션 미실행 여부를 확인하세요.

---

## 운영 흐름 요약

```
수업 진행
  → Lesson Logs 입력
  → 데이터 누적
  → Dashboard 반영
  → 학생 상세에서 흐름 확인
  → Consultation Cards 생성
  → Parent Reports 생성
  → 학부모/학생 포털에서 조회
```

---

## 주요 메뉴 정리

| 메뉴 | 설명 |
|------|------|
| Dashboard | 학원 전체 상태 |
| Students | 학생·반 관리, 포털 연결, 학생별 보기 |
| Lesson Logs | 수업·숙제·점수 입력 |
| Consultation Cards | 상담 카드 생성 |
| Parent Reports | 학부모 리포트 생성 |
| Settings | 학원명·계정·반 관리 |

---

## 핵심 목적

EduFlow는 단순 학원 ERP가 아니라, **학생 기록을 구조화**하여

- 상담 준비를 쉽게 하고
- 학부모 신뢰를 높이며
- 학생 흐름을 체계적으로 관리할 수 있게 돕는

**수학학원 운영 플랫폼**입니다.

---

## 개발·배포 (참고)

```bash 
npm install
npm run dev
```

로컬: [http://localhost:3000](http://localhost:3000)

### Vercel 환경 변수

| 이름 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API 키 |    
| `GEMINI_API_KEY` | Google Gemini (서버 전용, 상담 카드·학부모 리포트) |
| `GEMINI_MODEL` | 선택, 기본 `gemini-2.0-flash` |

### 추가 문서

| 문서 | 내용 |
|------|------|
| [USAGE_GUIDE.md](./USAGE_GUIDE.md) | 예시 시나리오(햇살수학, 이준호 등) |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | SQL 마이그레이션 001~008, 오류 해결 |
| [docs/EDUFLOW.md](./docs/EDUFLOW.md) | EduFlow 비전·기능 로드맵 |

### 발표 시연용 DB 시드

1. Supabase Auth에 아래 3계정을 **앱 회원가입**으로 먼저 만듭니다 (비밀번호 `okto0914!`).
   - `okto0914@gmail.com` — 원장/강사
   - `okto0915@gmail.com` — 학부모
   - `okto0916@gmail.com` — 학생
2. 마이그레이션 001~012 적용 후, [`docs/DEMO_SETUP.md`](./docs/DEMO_SETUP.md) 참고 — `npm run demo:auth` → [`supabase/seed-eduflow-demo.sql`](./supabase/seed-eduflow-demo.sql) 실행
3. 로그인 확인: 원장 대시보드·시간표·박서연 학생 상세 / 학부모·학생 포털(박서연)

**기술 스택:** Next.js 15 · Supabase Auth/DB · TypeScript · Tailwind
