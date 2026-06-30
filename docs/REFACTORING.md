# EduFlow 리팩토링 & 개선 문서

> 최종 업데이트: 2026-07-01  
> 앱 배포 방식: **Flutter WebView** (Next.js 그대로, Flutter가 shell)

---

## 완료 이력

- ~~P0-1~~ 출결·성적 사이드바 추가
- ~~P0-2~~ `parent-reports` `useSearchParams` 교체 + previewOpen
- ~~P0-3~~ `StudentDetail` 영어 텍스트 한국어화
- ~~P0-4~~ `useLessonActions` close/reopen 포함
- ~~P1-1~~ `useParentMessages` Realtime 구독
- ~~P1-2~~ `useToast` timerRef 자동 닫힘
- ~~P1-5~~ `consultationPoints` index key → id key
- ~~P1-8~~ `StudentGrowthWidget` chartPlaceholder 제거
- ~~P1-1~~ `ParentPortalSecondaryPanels` 탭 lazy load
- ~~P1-2~~ `globals.css` 시맨틱 색상 토큰 (앱 ERP/포털)
- ~~P1-3~~ `/notifications` 사이드바 진입점
- ~~P1-4~~ 학부모 리포트 저장 후 FCM (`/api/parent-reports/notify`)
- ~~P2-1~~ 채팅 인프라 (스키마 048–051 · Realtime · UI · FCM · 읽음/이름변경)
- ~~P0-2~~ `PhoneSignupWizard` 약관 동의
- ~~P1-5~~ `/join/[code]` 강사 역할 지원
- ~~P2-2~~ 성적 반 평균 대비 (스태프·학생·학부모)
- ~~P2-3~~ `useDashboardStats` stale-while-revalidate 캐시
- ~~P2-5~~ `ManagementReportView` PlaceholderChart → Recharts
- ~~Flutter 연동~~ `push_tokens` · `AuthContext` FCM · `api/push/send` · SafeArea

---

## 전체 유저 플로우

```
Landing
├── 로그인 (/login)
│   ├── 이메일 또는 전화번호 + 비번
│   ├── Google 로그인
│   └── 데모 체험
└── 회원가입 (/signup)
    ├── owner/teacher/desk
    │   └── 이메일+비번 → 이메일 인증 → /onboarding
    │       ├── Step1: 기본 정보 (StepProfile)
    │       └── Step2 역할별
    │           ├── owner  → StepOwnerAcademy (학원 생성 → 3일 체험 구독 자동 생성)
    │           ├── teacher/desk → StepTeacherJoin (학원 코드 입력)
    │           └── → 대시보드
    ├── parent  → /signup/parent → PhoneSignupWizard → /parent (포털)
    ├── student → /signup/student → PhoneSignupWizard → /student (포털)
    └── /join/[code] → 역할(student/parent/teacher) → 가입 → 포털/온보딩
```

---

## P0: 출시 전 필수

### P0-1. SMS Mock 구현 (보안) — 실연동 전 먼저

**현재 문제:** `lib/phoneAuth.ts`의 `MOCK_SMS_CODE = '000000'` — 아무나 통과 가능

**Mock 설계 완료 →** `docs/SUBSCRIPTION_DESIGN.md` 참고  
→ 고정 코드 `123456`, `phone_verifications` 테이블, TTL 5분, Provider 패턴

**구현 파일:**
```
lib/sms/types.ts           ← SmsProvider 인터페이스
lib/sms/mockProvider.ts    ← 123456 고정, phone_verifications 테이블
lib/sms/solapiProvider.ts  ← 실연동 stub (나중에 채움)
lib/sms/index.ts           ← SMS_PROVIDER env로 선택
app/api/sms/send/route.ts
app/api/sms/verify/route.ts
supabase/migrations/053_phone_verifications.sql
```

실제 Solapi 연동: `SMS_PROVIDER=solapi` 환경변수 + `solapiProvider.ts` 구현만 하면 됨. 나머지 코드 변경 없음.

---

### P0-2. 전화번호 사용자 비밀번호 찾기 불가

**파일:** `app/(auth)/forgot-password/`

학생·학부모는 전화번호로 가입 → 이메일 없음 → 비밀번호 분실 시 복구 방법 없음.

**수정:**
```
비밀번호 찾기
├── 탭: 이메일 (원장/강사)
└── 탭: 휴대폰 번호 (학생/학부모)
    → SMS 인증 → 새 비밀번호 설정
```

P0-1 SMS Mock 완료 후 구현.

---

## P2: 중기 개선

### P2-1. EduFlow 구독 결제 — Mock 우선 구현

**설계 문서:** `docs/SUBSCRIPTION_DESIGN.md`

**흐름:**
```
학원 생성 → 3일 무료 체험 (trialing)
체험 만료 → /subscribe 강제 이동
플랜 선택 + Mock 결제 → active (30일)
```

**구현 파일:**
```
supabase/migrations/052_subscriptions.sql    ← academy_subscriptions, subscription_payments
lib/subscription/guard.ts                    ← checkAcademySubscription()
lib/subscription/trialService.ts             ← createTrialSubscription(), expireTrialNow()
lib/payment/types.ts                         ← PaymentProvider 인터페이스
lib/payment/mockProvider.ts                  ← Mock 결제 (즉시 active)
lib/payment/tossProvider.ts                  ← 실연동 stub
lib/payment/index.ts                         ← PAYMENT_PROVIDER env로 선택
app/(app)/layout.tsx                         ← 서버 Guard — /subscribe 리다이렉트
app/(app)/subscribe/page.tsx                 ← 플랜 선택 + Mock 결제 버튼
app/api/subscription/activate/route.ts
app/api/subscription/dev-expire/route.ts     ← 개발 전용
components/subscription/SubscriptionBanner.tsx
components/subscription/DevTools.tsx         ← prod에서 자동 숨김
hooks/useSubscription.ts
```

**플랜 가격:**
| 플랜 | 월 | 학생 수 |
|------|-----|---------|
| 스타터 | 39,000원 | 50명 |
| 성장 | 79,000원 | 150명 |
| 프로 | 149,000원 | 무제한 |

실제 Toss 연동: `PAYMENT_PROVIDER=toss` + `tossProvider.ts` 구현만. 나머지 변경 없음.

---

## Flutter 프로젝트

위치: `C:\Users\chick\okto\eduflow_app\`  
세팅 가이드: `eduflow_app/SETUP.md`

- [ ] Flutter 설치 (`winget` 실패 → flutter.dev 직접 다운로드)
- [ ] `flutter create . --org kr.eduflow`
- [ ] Firebase 프로젝트 생성 + `google-services.json`
- [ ] 로컬 테스트 후 배포 URL로 교체

---

## 작업 체크리스트

### P0 — 출시 전 필수
- [ ] P0-1: SMS Mock 구현 (Provider 패턴 + `phone_verifications` 테이블)
- [ ] P0-2: 전화번호 비밀번호 찾기 — P0-1 완료 후

### P2 — 중기
- [x] P2-1: 구독 결제 Mock 구현 (`docs/SUBSCRIPTION_DESIGN.md`)

### Flutter
- [ ] Flutter 설치 + 프로젝트 초기화
- [ ] Firebase 연동 + 테스트
