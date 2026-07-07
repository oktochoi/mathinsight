# 페이지별 기능 감사 보고서

**평가일**: 2026-07-07 · **최종 반영**: 2026-07-07
**대상**: `app/(app)`, `app/parent`, `app/student`, `app/(auth)`, `app/auth`, `app/onboarding`, `app/(marketing)` — 총 71개 라우트

점수는 완성도 · 독립성 · 접근성을 종합한 10점 만점 기준.

## 요약 통계

| 지표 | 값 |
|---|---|
| 평가한 라우트 수 | 71 |
| 완성·유지 (8~9점) | 52+ |
| 부분 완성 (5~7점) | 6 |
| 죽은 코드 (0~4점) | 0 (정리 완료) |

---

## ① 우선순위 조치 — 반영 현황

| 항목 | 상태 |
|------|------|
| P1 Toss 구독 결제 | `tossProvider` + 결제창 + confirm API 구현. `PAYMENT_PROVIDER=toss`, `TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY` 설정 시 실연동 |
| P1 SMS/카카오 알림 | Solapi SMS 구현. `SMS_PROVIDER=solapi` + 연동 설정 ON 시 실발송. 카카오 알림톡은 준비 중(데모) |
| P2 커리큘럼·숙제 사이드바 | 완료 |
| P2 schedule/prep 통합 | 완료 |
| P2 3중 편집 안내 | 출결·숙제에 오늘 수업 배너 추가 |
| P2 consultation-cards | 사이드바 추가 |
| P3 죽은 코드 | retention PageClient, student-review shim 등 정리 |
| Contact API | `POST /api/marketing/contact` + `contact_inquiries` 테이블 |
| 학생 history/learning | `/student/learning?tab=history`로 통합, `/student/history`는 shim |

---

## ② 스태프 핵심 업무

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/dashboard` | 9 | 완성 — 강사 미납 집계 scope 적용 |
| `/students`, `/students/[id]` | 8 | 완성 — 학습추세 실데이터 |
| `/classes`, `/schedule`, `/curriculum` | 8 | 완성 — prep 리다이렉트, 사이드바 노출 |

## ③ 학사 관리

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/homework`, `/attendance` | 7 | 완성 — lesson_logs 안내 배너 |
| `/lesson-logs` | 9 | 완성 — 단일 소스 |
| `/consultation-cards` | 8 | 완성 — 사이드바 노출 |
| `/counseling` | 7 | STT는 수동 전사 (UI 안내) |
| `/student-growth`, `/student-review`, `/retention` | 5 | `/analytics` shim |

## ④ 관리 · 소통 · 결제

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/notifications` | 7 | Solapi 연동 시 실발송, 미설정 시 데모 |
| `/billing` | 9 | 중복 청구 방지, 강사 scope |
| `/subscribe` | 7 | Mock + Toss 분기 (`PAYMENT_PROVIDER`) |
| `/messages`, `/notices`, `/settings`, `/analytics` | 9 | 완성 |

## ⑤ 학부모 포털

스태프 작성 · 학부모 열람 역할 분리 — 중복 없음. `/parent-view` 빈 디렉터리는 저장소에 없음.

## ⑥ 학생 포털

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/student` | 8 | 시험/수업 점수 분리, stat 링크 수정 |
| `/student/learning` | 8 | 요약·수업기록 탭 통합 |
| `/student/history` | — | `/student/learning?tab=history` shim |
| `/student/homework`, `/exams` 등 | 8 | 완성 |

## ⑦ 인증 · 온보딩

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/join/[code]` | 8 | 공용 RolePicker |
| `onboarding/steps/*` | 9 | 현재 온보딩에서 사용 중 (구 Step1~4와 다름) |

## ⑧ 마케팅

| 페이지 | 점수 | 상태 |
|---|---|---|
| `/contact` | 8 | API 문의 접수 + honeypot |
| `/product`, `/pricing`, `/about` 등 | 8~9 | 완성 |

---

## 환경 변수 (실연동 시)

```env
# Toss 구독
PAYMENT_PROVIDER=toss
TOSS_SECRET_KEY=
NEXT_PUBLIC_TOSS_CLIENT_KEY=
NEXT_PUBLIC_PAYMENT_PROVIDER=toss

# Solapi SMS
SMS_PROVIDER=solapi
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_PHONE=

# 공통
SUPABASE_SERVICE_ROLE_KEY=
```

마이그레이션 `059_contact_inquiries.sql` — Supabase SQL Editor에서 실행 필요.
