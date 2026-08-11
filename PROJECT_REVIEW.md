# EduFlow (mathinsight) 프로젝트 리뷰

> 작성일: 2026-07-25  
> **최종 갱신: 2026-07-25 — P0/P1 및 다수 P2 반영 완료. 아래 §4는 잔여만 표시.**  
> 방법론: 코드베이스 정적 분석 + 설계 문서 대조 → 이후 구현 스프린트에서 갭을 순차 해소.

---

## 구현 완료 (코드 반영됨 — 상세 이력은 git)

| 영역 | 조치 |
|------|------|
| AI 가드레일 | 학부모/스탭 프롬프트 범위 밖 질문 거부 |
| analytics gating | `analytics.view` |
| GlobalSearchBar | 제거 |
| `.env.example` | `NEXT_PUBLIC_APP_URL` |
| 일정 권한 | `schedule.view` / `manage` + UI |
| Teacher Scope | `useStudents` / `useClassSchedules` |
| AI 토큰 TopNav | `/api/ai/usage` |
| 고아 컴포넌트 | ConnectWithCode / ConnectionRequests / PortalInvite / PhoneSignupWizard 삭제 |
| 랜딩 CTA · SEO | 도입 문의, 키워드 |
| 카카오 UI | 출시 예정 배지 |
| 이메일 로그인 통일 | 원장 이메일 가입, 로그인 이메일, 휴대폰 강제 인증 해제 |
| Route/API 가드 | `requirePermission`, proxy path 가드 |
| 행사 무료 | `PROMO_ALL_FREE.active = true` (의도적 유지) |
| 대시보드 | 오늘 결석·최근 공지 카드 추가 |
| 온보딩 | 비원장 connect 스텝 → 초대 안내로 교체 |
| 사이드바 | 직원·권한 메뉴 승격 |
| `ROLE_PERMISSION_DESIGN.md` | 구현 완료 기준으로 갱신 |

---

## 4. 잔여 백로그

| 항목 | 우선 | 비고 |
|------|------|------|
| 전 API `requirePermission` 일괄화 | P2 | 민감 API만 적용됨 |
| 부원장(`admin`) 권한 차등 | P2 | 현재 owner와 동일 |
| ACA365식 기능 애드온 과금 | P2 | 비즈니스 판단 |
| DB 이중 경로 정리 | 장기 | USER_MODEL_ARCHITECTURE |
| FCM/인앱/SMS 채널 UX 문구 통일 | P2 | 동작은 채널별 상이 |

---

## 원본 분석 (참고)

아래 §1~3·§5~8은 리뷰 당시(구현 전) 분석이다. **현재 동작은 위 「구현 완료」표와 `docs/ROLE_PERMISSION_DESIGN.md` §0을 우선한다.**

<details>
<summary>리뷰 원문 접기</summary>


가장 먼저 짚어야 할 두 가지:

1. **결제가 사실상 꺼져 있다.** `lib/marketing/promoPricing.ts`의 `PROMO_ALL_FREE.active = true`가 켜져 있어 `subscriptionRedirectPath()`가 구독 체크를 완전히 우회한다(`lib/subscription/index.ts`). 즉 지금 신규 가입 학원은 결제 없이 전체 기능을 무제한 사용 중이며, 결제 유도 자체가 발생하지 않는다. 매출과 직결된 스위치이므로 의도된 프로모션인지 방치된 설정인지부터 확인이 필요하다.
2. **사용자가 이번에 요청한 방향(휴대폰 로그인 제거 → 이메일/아이디 로그인 통일)이 최근 내부 설계 방향(`docs/UX_FLOW_AUDIT_2026-07-01.md` E항)과 정반대다.** 그 문서는 오히려 "원장만 이메일 가입이라 통일이 안 되니 원장도 휴대폰 가입으로 맞추자"고 제안하고 있다. 즉 학부모·학생은 이미 완전히 휴대폰 기반이고, 원장만 하이브리드(이메일 또는 휴대폰 모두 로그인 아이디로 허용)다. 이 문서에서는 양쪽 방향을 모두 정리해 사용자가 의식적으로 선택하도록 했다(§2.6).

그 외 핵심 발견:
- 검색창은 완전히 죽어있는 `disabled` placeholder다(개발자가 "후속 작업"이라고 주석까지 남김).
- AI 챗봇에 "학원 업무 범위 밖 질문(숙제 대행, 문제 풀이) 거부" 가드레일이 전혀 없다 — 지금 그대로면 범용 과외 챗봇처럼 쓰일 수 있다.
- `docs/ROLE_PERMISSION_DESIGN.md`가 "미구현"이라고 전제한 권한 체계(desk 역할, permission key, 설정 UI)는 사실 **이미 구현되어 있다** — 문서가 코드보다 오래됐다. 반면 일정(Schedule) 화면은 권한 체크가 **전혀 없어** 강사도 원장과 동일하게 생성/수정/삭제가 가능하다 — 사용자가 지목한 문제가 실제로 존재한다.
- 학부모-학생 연결 기능은 **두 개의 구현이 공존**한다. 설계 문서상의 "요청 → 원장 승인" 큐 방식은 코드가 존재하지만 **앱 어디에도 연결되어 있지 않은 고아 컴포넌트**이고, 실제로 동작하는 것은 휴대폰 인증 기반 즉시 연결 방식이다.

---

## 1. 현재 프로젝트 분석

### 1.1 디렉토리/라우팅 구조

Next.js App Router 기반. 최상위 라우트 그룹:

```
app/
├── (marketing)/     공개 랜딩 — 홈/product/pricing/about/contact/faq/security/customers/privacy/terms
├── (auth)/          로그인/가입/비밀번호 재설정
├── (app)/           스탭(원장·강사·데스크) 전용 26개 라우트
├── auth/            OAuth 콜백, choose-role
├── onboarding/       역할별 온보딩 wizard
├── join/            초대 링크 진입점
├── parent/          학부모 포털
├── student/         학생 포털
└── api/             49개 route.ts (agents/ai/auth/calendar/chat/counseling/cron/invite/marketing/messages/notifications/parent-agent/parent-reports/parents/push/rag/retention/settings/sms/staff-agent/student-invite/students/subscription/workspace)
```

`app/(app)` 하위 26개 라우트가 사이드바 메뉴 수(18+)보다 많은 이유는 `/analytics`(→`/dashboard` 1줄 redirect), `/integrations`(→`/settings?tab=integrations` redirect), `/parent-view`, `/student-review` 등 숨김/2차 라우트가 섞여 있기 때문. `docs/PRODUCT_IA.md`에서 이미 이 중복을 지적하고 상당 부분(연동, 학생/반/학부모 탭 통합 등) 정리했다.

### 1.2 인증(Authentication)

**요청서의 전제("휴대폰 번호 로그인")와 실제 구현이 다르다.** 정확한 현재 상태:

| 역할 | 가입 방식 | 로그인 방식 |
|------|-----------|-------------|
| 원장(owner) | 휴대폰 인증 3단계(`PhoneSignupWizard`, mode=owner) — 이메일/비밀번호 폼 아님 | **하이브리드**: 이메일 또는 휴대폰 번호 모두 로그인 아이디로 허용 (`resolveLoginEmail`, `lib/phone.ts:30-35`). UI 라벨은 "휴대폰 번호"만 표기 |
| 강사 | 초대 전용(자유가입 불가) | 원장과 동일 폼 |
| 학부모 | 휴대폰 인증 (`PhoneSignupWizard`, mode=parent) | 휴대폰 번호 (내부적으로 가짜 이메일 `{번호}@phone.eduflow.local`로 Supabase Auth 계정 생성) |
| 학생 | 휴대폰 인증 또는 학원 발급 코드 | **로그인코드 + PIN** (`StudentLoginForm`, `/api/auth/student-login`) — 휴대폰/이메일 아님 |

**구조적 리스크**: 휴대폰 가입은 `{휴대폰번호}@phone.eduflow.local`라는 가짜 도메인 이메일로 Supabase Auth 계정을 만든다(`lib/phone.ts:25-27`). 만약 Supabase 프로젝트의 "Confirm email" 옵션이 켜져 있으면, 이 가짜 도메인으로는 확인 메일을 받을 수 없어 가입이 구조적으로 막힌다. 현재 이 옵션이 켜져 있는지는 코드로 확인 불가(`supabase/config.toml` 없음, Dashboard 설정에 의존) — **반드시 Supabase Dashboard에서 직접 확인 필요**.

**비밀번호 재설정**: `lib/siteUrl.ts`에 견고한 우선순위 체인(`NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` → Vercel 환경변수 → `window.location.origin` → 최후 `localhost:3000` 폴백)이 있어, 사용자가 우려한 "재설정 링크가 localhost로 간다"는 프로덕션에서는 사실상 발생하지 않는다. `.env.example`에는 `NEXT_PUBLIC_SITE_URL`만 정의돼 있고 `BASE_URL`/`APP_URL`은 없다(코드가 참조하는 `NEXT_PUBLIC_APP_URL`이 예제 파일에 누락).

### 1.3 Role 관리 방식

DB `users.role`: `'admin' | 'teacher' | 'desk' | 'parent' | 'student'` (admin=DB 레거시명). 앱 레이어 `lib/roles.ts`의 `UserRole`은 `'owner' | 'teacher' | 'desk' | 'parent' | 'student'` — `fromDbRole()`이 `admin→owner`로 항상 합쳐버려 **DB에 admin 값이 남아있어도 앱에서는 owner와 구분되지 않는 죽은 분기**다. `docs/ROLE_PERMISSION_DESIGN.md`가 제안한 "부원장(Admin)" 역할 분리는 UI 옵션(`StaffPermissionsSection.tsx`)만 있고 실질적 권한 차등은 없다.

### 1.4 DB 구조

`docs/USER_MODEL_ARCHITECTURE.md`에 정밀 분석되어 있음(요약):
- Auth: `auth.users` → 트리거 → `public.users`(role, academy_id 단일 FK)
- Staff: `staff_profiles` (1:1) → `class_teachers`(M:N, 정식) vs `classes.teacher_id`(레거시 단일 FK) **이중 참조 병존**
- Student: `students`(CRM) → `student_enrollments`(반 배치 이력) vs `students.class_id`(단일) **이중 관리**
- Portal 연결: `student_connection_requests`(대기) → `student_connections`(승인) / `parents` / `parent_student_links` **3개 테이블이 유사 관계를 중복 표현**
- Lesson: `lesson_logs`(레거시 write 진입점) → 트리거로 `lessons`/`attendance_records`/`lesson_scores`(정규화 테이블) 동기화 — 이중 경로

이 문서가 제안한 `academy_memberships`(멀티 역할·멀티 학원 지원) 테이블은 **아직 구현되지 않음**. 현재는 한 사람 = 한 역할 = 한 학원 고정.

### 1.5 API 구조

App Router Route Handler 49개(`app/api/*/route.ts`). 대부분의 CRUD는 클라이언트에서 Supabase SDK로 직접 RLS를 거쳐 처리하고, API Route는 (a) 서버 권한이 필요한 작업(SMS 발송, 학생 초대, 구독 활성화), (b) AI 에이전트 호출, (c) cron 작업(푸시 알림 배치)에 집중되어 있다. `docs/ROLE_PERMISSION_DESIGN.md`가 제안한 `requirePermission()` 서버사이드 가드는 **미구현** — API Route 레벨 권한 체크는 개별 route마다 수기로 되어 있어 일관성이 낮다.

### 1.6 Frontend Component 구조

`components/` 하위 30개 이상 도메인 디렉토리(auth, dashboard, students, schedules, billing, chat, onboarding, portal, subscription 등). 훅 50개 이상(`hooks/use*.ts`)이 Supabase 쿼리를 캡슐화하는 패턴 — 사실상 프로젝트의 데이터 레이어.

### 1.7 상태관리 방식

- 전역 클라이언트 상태는 최소한: `store/useAppStore.ts`는 Zustand로 `dataVersion` 카운터 하나만 관리(캐시 무효화 트리거용).
- 인증/프로필 상태는 `context/AuthContext.tsx` (React Context).
- 나머지는 전부 컴포넌트 로컬 상태 + 커스텀 훅(`hooks/use*.ts`)의 `useEffect`/수동 refetch 패턴. React Query/SWR 같은 서버 상태 라이브러리는 쓰지 않음 — 훅마다 로딩/에러/refetch를 직접 구현해야 해서 보일러플레이트가 반복됨(구조적 문제로 볼 수 있으나 이번 리뷰 범위상 우선순위 낮음).

### 1.8 권한 처리 방식

세 계층이 존재하나 일관되게 적용되지 않는다:
1. **Route prefix 가드** (`lib/authRedirectPolicy.ts`) — staffPrefixes 배열로 스탭/학부모/학생만 구분. Permission 단위 가드 없음.
2. **Permission key 시스템** (`lib/permissions.ts`, `lib/staffPermissions.ts`) — 19개 키, `DEFAULT_PERMISSIONS`, `useStaffPermissions()` 훅 구현됨. `Sidebar.tsx`가 이를 이용해 메뉴를 필터링(`requiredPermissions`).
3. **Teacher Scope 훅** (`hooks/useStaffScope.ts`) — 담당 반 계산 로직은 있으나 배너 표시 용도로만 쓰이고, `useStudents`/`useClassSchedules` 등 실제 데이터 조회 훅에는 **적용되지 않음**.

**핵심 갭**: 2번(사이드바 메뉴 숨김)까지만 되어 있고, 3번(실제 데이터 필터링)과 route/API 레벨 가드는 안 되어 있다. 즉 **"메뉴에는 안 보이지만 URL을 알면 강사도 접근 가능"**한 상태의 화면이 존재할 수 있다. 특히 `/schedule`, `/analytics`는 사이드바 gating조차 빠져 있다(아래 §2.11, §2.12).

### 1.9 구조 전반의 문제점 (요약)

| # | 문제 | 심각도 |
|---|------|--------|
| S1 | `PROMO_ALL_FREE` 활성화로 구독 게이트 완전 우회 — 매출 발생 불가 | 최상 |
| S2 | 일정(Schedule) 화면에 role/permission 체크 전무 | 상 |
| S3 | Teacher Scope가 실데이터 훅에 미적용 (배너만 존재) | 상 |
| S4 | 학부모-학생 연결: 승인 큐 방식 코드는 있으나 미연결(고아 컴포넌트) | 중 |
| S5 | `classes.teacher_id` vs `class_teachers`, `lesson_logs` vs 정규화 테이블 등 DB 이중 경로 다수 | 중 |
| S6 | Route/API 레벨 permission 가드 미구현 (사이드바 숨김에만 의존) | 중 |
| S7 | 전역 검색창이 완전히 죽어있는 placeholder | 낮음(UX) |

---

## 2~3. 요청 항목별 현재 상태 · 문제점 · 개선안

> 사용자가 요청한 18개 항목을 각각 "현재 → 문제점 → 개선안" 순으로 정리. (사용자 요청 순서를 따르되 연관 항목은 묶었다.)

### 2.1 좌측 메뉴 (IA)

**현재**: `lib/staffNavigation.ts`의 `STAFF_NAV_SECTIONS` 9개 섹션 — 오늘 현황 / 수업(오늘 수업·시간표·출결·성적·숙제·커리큘럼) / 학생 / 반 / 학부모(연결·공지·문의함) / 상담(상담·요약카드·리포트) / 수납 / 경영(리포트) / 설정(설정·문자·알림). `/integrations`는 설정 탭으로 리다이렉트 통합됨. `docs/PRODUCT_IA.md`가 제안한 재구성이 이미 대부분 반영된 상태.

**문제점**:
- "직원 추가/권한 관리"라는 사용자가 언급한 메뉴가 사이드바에 없음 — `/settings` 탭 안(`permissions` 탭, owner 전용)에 숨어 있어 발견성이 낮음.
- 직원 초대용 `PortalInviteSection.tsx`가 **어디서도 import되지 않는 고아 컴포넌트** — 실제 초대는 `AcademyConnectionCodeSection`(코드 발급 방식)으로만 이뤄짐. 두 개의 미완성 초대 경로가 공존.
- "경영 설정"이라는 이름의 메뉴는 없음(경영=analytics 리포트뿐) — 사용자가 지칭한 명칭과 실제 IA가 어긋남.

**개선안**:
- "설정" 섹션 하위에 "직원·권한" 서브탭을 시각적으로 승격(현재도 탭이지만 진입 경로 안내 부족 — 온보딩 유도 배너 추가).
- `PortalInviteSection.tsx` 삭제 또는 실제 라우트에 연결 — 두 경로 중 하나로 통일.
- 사이드바 라벨을 실제 기능과 1:1 매칭되게 재검토(경영 리포트 vs 경영 설정 혼동 제거).

### 2.2 오늘의 할 일(Dashboard)

**현재**: `DashboardClient.tsx`가 role별로 `DashboardActionBoard`(원장/데스크) 또는 `TeacherActionBoard`(강사)를 분리 렌더링 — 사용자가 원했던 "원장/강사 다른 대시보드"가 **이미 일부 구현되어 있음**. 상단 `TodayCommandCenter`가 오늘 수업/진행중/마감필요/상담예정/미납연체/학부모문의 6개 지표 카드 표시. 좌측(오늘 수업, 할 일 목록) + 우측 sticky(재등록/수납/성장/문의/공지/운영차트/타임라인).

**문제점**:
- 사용자가 요청한 6개 항목(일정/상담/수납/미납/출결/알림) 중 **출결과 인앱 알림 전용 위젯이 없음** — 출결은 개별 수업 패널에 묻혀 있고, 알림은 대시보드에 아예 노출 안 됨.
- `docs/UX_FLOW_AUDIT_2026-07-01.md` D항목이 이미 지적: `DashboardActionBoard`가 세로로 매우 길고 카드 리듬이 깨져 있음(2단 배치가 재등록·수납 스냅샷 한 줄뿐).

**개선안**:
- `TodayCommandCenter` 6개 카드에 "결석 N명"(출결), "새 알림 N건"을 추가해 8개 카드 그리드로 확장하거나, 기존 카드 중 우선순위 낮은 것과 교체.
- UX_FLOW_AUDIT D안대로 좌(할일)-우(스냅샷 sticky) 2컬럼 리듬을 전체 카드에 일관 적용.

### 2.3 알림 시스템

**현재**: 인앱 알림은 `notification_logs` 테이블 기반 로그(`hooks/useNotifications.ts`) — `/api/notifications/send`가 `channel=in_app`이거나 연동이 꺼져 있으면 **무조건 `status: 'demo'`로만 기록**하고 실제 전달 메커니즘(브라우저 푸시/토스트)은 없음. SMS는 Solapi 키가 설정된 경우에만 실발송(`lib/sms/solapiApi.ts`), 아니면 데모. 카카오 알림톡은 **하드코딩으로 항상 "준비 중"** 처리(완전 미구현). `lib/notificationPreferences.ts`에 카테고리별 알림 on/off 설정은 있으나 실제 푸시 채널은 대응 안 됨. 별도로 `docs/PRODUCT_GAPS.md`에 따르면 **Flutter 앱 + FCM 푸시는 이미 완성되어 출결/숙제/성적/공지/상담/재등록 알림이 실제로 학부모 앱에 전달되고 있음**(cron 기반).

**문제점**: "일반 알림"(인앱 로그, 사실상 미완성) vs "SMS"(부분 실동작) vs "앱 푸시"(FCM, 실제로 잘 되어 있음) 세 채널이 혼재하는데 문서화나 UI상 구분이 안 되어 있어 "알림"이라는 단어가 가리키는 게 매번 다름.

**개선안**:
- 사용자 요청대로 "일반 알림(인앱) / 문자(SMS)"로 나누되, **이미 잘 되어 있는 FCM 앱 푸시를 핵심 채널로 승격**하고 인앱 로그는 "발송 이력 조회" 용도로 재정의.
- 카카오 알림톡은 실제 연동 계획이 없다면 설정 UI에서 "준비 중" 배지를 명확히 표시하거나 항목 자체를 숨김(현재는 토글이 동작하는 것처럼 보여 혼란 유발).
- SMS는 Solapi 키 유무에 따라 설정 화면에서 "연동 상태: 미설정/연동됨"을 명시.

### 2.4 연동 기능

**현재**: `/settings?tab=integrations`에 구글 캘린더(ICS), SMS, 카카오 3개. ICS는 실제 동작(`app/api/calendar/ics` 구독 URL 제공). SMS는 Solapi 키 설정 시만 동작. 카카오는 완전 mock.

**문제점**: 사용자가 "불필요한 연동은 제거" 요청 — 카카오는 실질 기능이 전혀 없이 UI만 있어 사용자에게 "되는 것처럼" 오인시킴.

**개선안**: 카카오 알림톡을 실제로 연동할 계획이 명확하지 않다면 UI에서 제거하거나 "출시 예정" 배지로 명시하고 토글을 비활성화. ICS는 유지, SMS는 Provider 상태를 노출.

### 2.5 회원가입 — 이메일 인증

**현재**: §1.2 참조. 이메일 인증 강제는 Supabase Dashboard 설정에 위임되어 있고 코드는 관여하지 않음.

**문제점**: 휴대폰 가입이 가짜 이메일 도메인을 쓰기 때문에, 이메일 인증을 강제로 켜면 휴대폰 가입 플로우 자체가 깨진다. 즉 "이메일 인증 필수화"는 지금 아키텍처와 정면충돌한다.

**개선안** (택1, 사용자 결정 필요):
- (A) 휴대폰 인증 자체를 본인 확인 수단으로 인정하고 이메일 인증은 도입하지 않음(현재 상태 유지) — 휴대폰 OTP가 이미 이메일 인증과 동등한 수준의 본인확인이므로 실익이 크지 않음.
- (B) 정말 이메일 인증이 필요하다면(예: 원장에게 실제 이메일 계정을 요구하고 싶다면), 원장 가입만 별도로 실제 이메일 입력 + Supabase confirm 이메일 방식으로 분리하고 학부모/학생은 휴대폰 방식 유지.
- 이번 리뷰에서는 (A) 유지를 권장 — 휴대폰 OTP가 이미 사실상 이메일 인증의 대체재이고, (B)는 §2.6과 함께 원장 가입 방식 전체를 다시 설계해야 하는 큰 작업이 됨.

### 2.6 로그인 방식 — 이메일/아이디 vs 휴대폰 (핵심 결정 필요)

**현재**: §1.2 표 참조. 학부모/학생은 이미 완전히 휴대폰(또는 코드+PIN) 기반. 원장/강사만 이메일 또는 휴대폰 둘 다 허용하는 하이브리드.

**충돌 지점**: 사용자는 이번 요청에서 "휴대폰 로그인 제거 → 이메일/아이디로 통일"을 원하지만, `docs/UX_FLOW_AUDIT_2026-07-01.md`(2026-07-01, 3주 전)는 정반대로 "원장도 휴대폰 가입으로 통일하자"고 제안했다. 둘 다 "로그인 방식 불일치"라는 같은 문제를 지적하지만 해결 방향이 반대다.

**개선안**: 아래 표로 트레이드오프를 제시하고 사용자가 선택하도록 함.

| 기준 | 이메일/아이디 통일 (사용자 이번 요청) | 휴대폰 통일 (기존 설계 방향) |
|------|---|---|
| 학부모·학생 UX 일관성 | 깨짐(학부모·학생은 이미 휴대폰 완성) — 재작업 필요 | 유지(이미 완성된 흐름에 원장만 맞추면 됨) |
| 비밀번호 찾기/계정 복구 | 이메일 기반이 표준적이고 직관적 | SMS 재인증 흐름 추가 구현 필요 |
| 스팸/도용 방지 | 이메일 인증 절차 필요 | 이미 OTP로 본인확인 완료 |
| 구현 비용 | 학부모·학생 로그인 폼 재작성 + 마이그레이션 | 원장 가입 폼만 `PhoneSignupWizard`로 교체(비교적 작음) |

**권장**: 구현 비용과 기존 진행 방향을 고려하면 "휴대폰 통일" 쪽이 작업량이 훨씬 적다. 다만 이메일 기반 로그인/비번찾기가 한국 B2B SaaS 관리자(원장) 입장에서 더 익숙할 수 있으므로, **원장만 예외적으로 이메일 로그인을 유지하는 현재 하이브리드가 실질적으로는 합리적인 절충안**일 수 있다. 이번 리뷰는 코드를 바꾸지 않으므로, 다음 대화에서 방향을 확정한 뒤 착수할 것을 권장.

### 2.7 비밀번호 찾기

**현재**: §1.2 참조 — 실제로는 localhost 하드코딩 문제가 존재하지 않음(견고한 폴백 체인 존재).

**문제점**: 실사용 버그는 아니지만 `.env.example`에 `NEXT_PUBLIC_APP_URL`이 누락돼 있어 신규 개발자가 환경변수를 잘못 설정할 여지가 있음.

**개선안**: `.env.example`에 `NEXT_PUBLIC_APP_URL` 주석 추가(코드가 실제로 참조하므로). Supabase Dashboard의 Redirect URL 허용 목록에 프로덕션 도메인이 등록되어 있는지 별도 확인 권장(코드 밖 설정이라 이 리뷰에서 검증 불가).

### 2.8 AI 토큰 표시

**현재**: `lib/aiUsage.ts`에 플랜별 월간 쿼터(free 10 / starter 100 / growth 500 / pro 50,000)와 `checkAiQuota()` 로직은 존재하지만, **이를 소비하는 UI 컴포넌트가 프로젝트 전체에 하나도 없음**. 한도 초과 시 429 에러 메시지로만 노출됨.

**개선안**: `TopNav.tsx`에 "AI 127/500" 형태의 소형 배지 추가. `useAiUsage()` 훅 신설(GET 엔드포인트 하나 필요 — 현재 `checkAiQuota`는 서버 전용 함수이므로 클라이언트 노출용 read API 분리 필요) → TopNav에서 폴링 없이 페이지 로드 시 1회 조회 + AI 사용 직후 로컬 갱신.

### 2.9 검색창

**현재**: `components/navigation/GlobalSearchBar.tsx` — `<input disabled>`이며 `onChange`/`onSubmit` 핸들러 없음. 개발자 주석 `/** 전역 검색 UI 자리 — 실제 검색 로직은 후속 작업 */`로 명시적 placeholder임이 확인됨.

**개선안**: 단기적으로는 학생 검색(이미 `matchesHangulSearch` 초성검색 로직이 `/students`에 구현되어 있음)을 전역 검색의 첫 데이터 소스로 재활용해 "학생 이름 검색" 정도로 범위를 좁혀 구현하거나, 당장 구현 계획이 없다면 `disabled` input 자체를 사이드바/TopNav에서 제거해 "안 되는 기능처럼 보이는" UI를 없앤다. 완전 신규 기능 구현보다 **제거가 더 빠르고 안전한 단기 조치**.

### 2.10 가격 및 플랜

**현재**: `/pricing` 페이지 존재(`components/marketing/pages/PricingPageContent.tsx`), 스타터(₩39,000/50명) / 성장(₩79,000/150명, 추천) / 프로(₩149,000/무제한) 3단 구성, 연 결제 20% 할인 표시. 단, **`PROMO_ALL_FREE.active=true`로 현재 모든 가격이 "무료"로 대체 표시되고 구독 게이트도 완전히 우회됨.**

**문제점**: 사용자가 요청한 "Starter/Pro/Premium/Enterprise" 4단 구조와 다르게 이미 3단(스타터/성장/프로) 체계가 구축돼 있고, 이게 프로모션으로 가려져 있어 현재 방문자는 실제 가격 체계를 볼 수 없음.

**개선안**:
- 최우선: `PROMO_ALL_FREE` 활성화가 의도된 것인지 확인 — 의도가 아니라면 즉시 끄고 구독 게이트 정상화(§4 P0).
- 4단 체계로 확장할지 여부는 비즈니스 판단 필요(Enterprise 티어는 보통 "문의하기" 형태의 커스텀 견적이므로 §2.16 CTA와 함께 설계).
- 플랜별 권한 제한(학생 수 상한)이 실제로 강제되는지(`lib/subscription/guard.ts`) 별도 검증 필요 — 이번 조사에서 guard.ts 세부 로직까지는 확인하지 못함.

### 2.11 권한(Role) 재설계

**현재**: `docs/ROLE_PERMISSION_DESIGN.md`가 "desk 역할 없음, permission 미구현"을 전제로 로드맵을 짰지만, 실제로는 **owner/teacher/desk/parent/student 5개 역할, 19개 permission key, `DEFAULT_PERMISSIONS`, 설정 화면(`StaffPermissionsSection.tsx`)까지 모두 구현되어 있다.** 문서가 코드보다 3~4주 뒤처져 있는 상태.

**실제 남은 문제**:
- `/analytics`가 사이드바 gating에서 빠져 있어 강사도 볼 수 있음(사용자가 요청한 "강사는 통계 확인 불가"와 직접 충돌).
- 매출(`/billing`)은 이미 `billing.view` permission으로 강사 기본 차단됨 — **사용자가 우려한 문제는 이미 해결되어 있음**.
- "경영 메뉴 접근 불가"는 `/settings`(`settings.academy`)로 이미 차단됨.
- Route/API 레벨 가드가 없어 URL 직접 접근 시 우회 가능성 존재(§1.8).

**개선안**:
- `/analytics` 사이드바 항목에 `requiredPermissions: ['analytics.view']` 한 줄 추가(즉시 수정 가능, 리스크 최소).
- `docs/ROLE_PERMISSION_DESIGN.md`를 현재 구현 기준으로 업데이트(문서 부채 해소).
- Route guard(`requirePermission()`) 도입은 중기 과제로 유지.

### 2.12 일정 관리 권한

**현재**: `app/(app)/schedule/PageClient.tsx`, `hooks/useClassSchedules.ts`, `components/schedules/ClassSchedulesSection.tsx` 전체에 role/permission 체크가 **0건**. 강사도 원장과 동일하게 모든 반의 일정을 생성·수정·삭제 가능. 사이드바에서도 `/schedule` 항목에 `requiredPermissions`가 없어 무조건 노출.

**개선안** (사용자가 요청한 정확히 그 방향):
1. `lib/permissions.ts`에 `schedule.manage`(생성/수정/삭제), `schedule.view`(조회) 키 추가.
2. `DEFAULT_PERMISSIONS.teacher`에는 `schedule.view`만 부여.
3. `ClassSchedulesSection.tsx`의 생성/수정/삭제 버튼을 `can('schedule.manage')`로 감싸기.
4. 강사가 "시간 수정 불가, 삭제 불가"라는 세부 요구는 permission을 더 세분화(`schedule.edit_time` 등)하거나, 간단하게는 강사에게 편집 폼 자체를 읽기전용으로 렌더링.
5. `useClassSchedules.ts`에 `useStaffScope()` 연동 — 강사는 담당 반 일정만 조회(§3.11 Teacher Scope 적용과 동일 패턴).

### 2.13 챗봇 — 원장/강사용 "고객센터 문의"

**현재**: `docs/UX_FLOW_AUDIT_2026-07-01.md`에 따르면 이미 계획됨 — 원장/강사 채팅 FAB에 "동료와 대화"(사람 채팅) + "AI 도우미"(제품 사용법/운영 인사이트) 두 모드를 넣는 설계가 있고, `lib/staffAgent.ts`가 이미 "제공된 제품 기능 설명만 근거로 답한다"는 원칙으로 시스템 프롬프트가 짜여 있다. 학부모/학생용 AI 챗봇은 `ParentAgentChat`으로 구현되어 자녀 학습 정보에 한정.

**문제점**: 사용자가 요청한 "관리자에게 문의" 형태(즉 실제 EduFlow 운영팀에게 직접 문의)는 별개다 — 지금 있는 "AI 도우미"는 AI가 제품 사용법을 답하는 것이지, 사람(EduFlow 팀)에게 연결되는 채널이 아니다.

**개선안**: "AI 도우미"(제품 사용법 안내, 이미 설계됨)와 별개로 "EduFlow 고객센터에 문의" 버튼을 하나 더 추가 — 이메일/카카오채널 링크 정도의 경량 구현으로 충분(실시간 상담원 시스템까지는 불필요).

### 2.14 AI 기능 제한 (범용 챗봇 방지) — 핵심 갭

**현재**: `lib/ai/parentAgentPrompt.ts`(`PARENT_AGENT_SYSTEM`)를 전문 확인한 결과 — "학생 데이터만 근거로 사용", "의학/심리 진단 금지", 출력 형식 규칙은 있지만 **"숙제 대행", "문제 풀이", "시험 답 요구" 같은 학원 서비스 범위 밖 요청을 거부하라는 지시가 전혀 없다.** `lib/parentAgentSecurity.ts`도 이름과 달리 콘텐츠 검열이 아니라 대화 히스토리 형식 검증(길이/턴수 제한)만 수행한다.

**결론**: 사용자가 우려한 "범용 ChatGPT처럼 쓰일 위험"이 **실제로 존재하는 구조적 갭**이다.

**개선안**:
1. `PARENT_AGENT_SYSTEM`, `STAFF_AGENT_SYSTEM` 프롬프트에 명시적 거부 규칙 추가: "학원 운영·자녀 학습 정보 조회와 무관한 질문(수학 문제풀이, 숙제 대행, 시험 답안 요구, 일반 지식 질문 등)은 정중히 거절하고 본래 목적을 안내한다."
2. 프롬프트 레벨 가드만으로는 우회(prompt injection) 가능성이 있으므로, `lib/ai/security.ts`의 `guardAiOutput()`에 응답 후처리 단계로 "수식/방정식 풀이 패턴" 등 간단한 휴리스틱 필터를 추가하는 것도 고려(비용 대비 효과는 낮을 수 있어 우선순위는 프롬프트 수정보다 낮게).
3. 이 변경은 리스크가 낮고(프롬프트 텍스트만 수정) 효과가 크므로 P0로 분류.

### 2.15 학부모 연결 (UX 재설계)

**현재**: **두 개의 병존 구현.**
- (A) 레거시 "요청 → 승인" 큐: `lib/studentConnection.ts` + `ConnectWithCodeForm.tsx` + `ConnectionRequestsSection.tsx`(원장 승인 화면) — 코드는 완성돼 있으나 **두 컴포넌트 모두 앱 어디에도 import되지 않는 고아 상태**. `/settings`에는 승인 화면이 없다.
- (B) 실제로 쓰이는 방식: 온보딩(`StepParentConnect`/`StepStudentConnect`, `app/onboarding/steps/`)에서 `PhonePortalConnect` → `preview_portal_link`/`confirm_portal_link` RPC로 **승인 절차 없이 즉시 연결**. `docs/INVITE_ONBOARDING_REDESIGN.md`에 이것이 의도된 설계임이 명시되어 있음.

**문제점**: (B)가 실제 동작 방식이라는 걸 아는 사람이 없으면 (A)의 죽은 코드를 "고쳐야 할 버그"로 오인하고 잘못 손댈 위험이 있음. 코드 정리 부채.

**개선안**:
1. `lib/studentConnection.ts`, `ConnectWithCodeForm.tsx`, `ConnectionRequestsSection.tsx`를 삭제하거나(즉시 사용 계획이 없다면), 반대로 "동명이인 등 즉시 매칭 실패 시 폴백"으로 되살려 연결하는 것 중 하나로 결정.
2. 사용자가 요청한 "학생 → 학부모 초대 → 인증 → 연결 완료" 플로우는 이미 (B)로 구현되어 있음 — 문서화만 부족한 상태이므로 `docs/INVITE_ONBOARDING_REDESIGN.md` 내용을 간단한 사용자 가이드로 정리해 온보딩 화면에 노출하는 정도로 충분.

### 2.16 메인페이지 "도입 문의하기"

**현재**: 랜딩 홈(`HomePageContent.tsx`) CTA는 전부 "3일 무료 체험"/"Demo 먼저 보기"/"화면 투어 보기" — 회원가입·데모 유도뿐. "도입 문의" 버튼은 `/pricing` 페이지 하단과 `/contact` 페이지에만 있고 **홈 화면에는 없음**.

**개선안**: Hero 섹션 또는 최하단 CTASection에 secondary 버튼으로 "도입 문의하기"(→ `/contact`) 추가. Flow: 홈 CTA 클릭 → `/contact` 폼(학원명/연락처/문의내용) → 제출 시 내부 알림(이메일 또는 Slack 웹훅) → 영업팀 대응. `/contact` 페이지가 이미 있으므로 폼 제출 처리 로직만 확인하면 됨(이번 조사 범위 밖 — 별도 확인 권장).

### 2.17 SEO

**현재**: 이미 상당히 잘 갖춰져 있음.
- `app/layout.tsx` + `lib/marketing/seo.ts`: title template, OpenGraph, Twitter 카드, Google/Naver 사이트 인증 메타 완비.
- 페이지별 SEO(`MARKETING_PAGE_SEO`): 홈 keywords에 `학원 ERP`, `학원 관리 프로그램`, `학원 상담`, `학부모 리포트`, `재등록 관리`, `학원 AI` 포함. **`학원 CRM`, `출결 관리`, `학원 일정 관리`, `학원 운영 프로그램`은 keywords에 없음.**
- JSON-LD: `components/marketing/MarketingJsonLd.tsx`에 Organization/WebSite/SoftwareApplication 3종 스키마 존재.
- `app/robots.ts`: 앱 내부 라우트(`/api`, `/auth`, `/dashboard`, `/parent`, `/student` 등) 정상 차단, sitemap 위치 명시.
- `app/sitemap.ts`: 마케팅 페이지 10개만 포함(`/demo`, `/workflow`, `/ai`, `/resources`는 `noIndex` 처리로 의도적 제외).

**개선안**: 누락된 키워드(`학원 CRM`, `출결 관리`, `학원 일정 관리`, `학원 운영 프로그램`)를 `MARKETING_PAGE_SEO`의 해당 페이지 keywords 배열에 자연스럽게 추가. 이 정도면 구조적으로는 이미 충분하므로 이번 리뷰의 다른 항목 대비 우선순위는 낮음.

### 2.18 ACA365 벤치마킹

공개된 정보 기준(2026-07 시점 웹 검색), ACA365는 "결제·출결·상담·성적·메신저 등 필요한 기능만 선택해 쓰는" **선택형(모듈형) 과금 모델**을 국내 최초로 도입한 것이 핵심 차별점이다. 출결은 자동 등원/퇴원 인식 + 실시간 보호자 알림 + 결석 시 보충 안내, 수납은 모바일 청구/결제/미납 자동화, 상담은 요청부터 통계까지 체계화되어 있다는 게 공개된 정보의 전부다(자세한 UI/메뉴 구조는 실제 로그인 후 화면 확인 없이는 검증 불가 — 필요하면 별도로 데모 계정을 발급받아 스크린샷 비교를 권장).

**우리 서비스가 참고할 만한 점**:
- **모듈형 과금**: 우리는 이미 학생 수 기반 3단 정액제(스타터/성장/프로)인데, ACA365처럼 "출결만 쓰고 싶다/수납까지 쓰고 싶다" 식의 기능 단위 선택은 없음. `docs/PRODUCT_GAPS.md`의 경쟁사 비교표(랜리즈/클래스업/어나더클래스)에는 없던 관점이므로, 가격 정책 재설계(§2.10) 시 "기능 애드온" 개념을 검토해볼 가치가 있음.
- **자동 출결 인식**(태그리더/QR 등 하드웨어 연동으로 추정)은 우리 쪽에 전혀 없는 영역이고, `docs/PRODUCT_GAPS.md`도 "키오스크 출결"을 미보유 항목으로 이미 지적함 — 우선순위는 하드웨어 투자 대비 ROI 판단이 필요해 이번 리뷰에서는 P2로만 표시.
- 반면 우리가 이미 앞서 있는 부분(AI 위험도 분석, 이탈 예측 → 원장 푸시, 상담 브리핑, 자체 앱 채널)은 `docs/PRODUCT_GAPS.md` 표에 이미 정리되어 있으므로 중복 작성하지 않음.

**Sources**: [ACA365 선택형 학원관리프로그램](https://aca365.co.kr/) · [세계로시스템, '선택형 학원관리 프로그램' ACA365 출시](https://www.sentv.co.kr/article/view/sentv202512010107)

---

## 4. 우선순위 (P0 / P1 / P2)

### P0 — 즉시 (리스크 낮고 효과 큼, 이번 스프린트)

| 항목 | 이유 |
|------|------|
| `PROMO_ALL_FREE` 활성화 상태 확인 및 처리 | 매출 발생 자체가 막혀 있음 — 의도 여부부터 확인 |
| AI 프롬프트에 "학원 업무 범위 밖 질문 거부" 규칙 추가 | 텍스트만 수정하면 되는데 오남용 리스크가 큼 |
| `/analytics` 사이드바에 `requiredPermissions` 추가 | 1줄 수정으로 강사의 통계 접근 차단 (사용자가 명시적으로 요청한 사항) |
| 죽은 검색창(`GlobalSearchBar`) 제거 또는 비활성 표시 정리 | "안 되는 기능"으로 보이는 UI 제거는 항상 저비용 고효과 |
| `.env.example`에 `NEXT_PUBLIC_APP_URL` 추가 | 신규 개발자 환경 설정 실수 방지 |

### P1 — 단기 (다음 1~2 스프린트)

| 항목 | 이유 |
|------|------|
| 일정(Schedule) 권한 체계 구현 (§2.12) | 사용자가 명시적으로 요청, 현재 완전 무방비 |
| Teacher Scope를 `useStudents`/`useClassSchedules` 등 실데이터 훅에 실제 적용 | 배너만 있고 실질 격리가 안 되는 상태 해소 |
| AI 토큰 표시 UI (TopNav 배지) | 로직은 있고 노출만 하면 됨 |
| 학부모 연결 고아 컴포넌트 정리 (삭제 or 되살리기 결정) | 코드 부채, 잘못된 유지보수 방지 |
| 랜딩 홈 "도입 문의하기" CTA 추가 | 저비용 구현, 리드 확보 채널 확대 |
| 로그인 방식 통일 방향 결정 (§2.6 — 사용자 확정 필요) | 결정 후 착수해야 재작업 방지 |

### P2 — 중기 (분기 내)

| 항목 | 이유 |
|------|------|
| Route/API 레벨 permission 가드(`requirePermission()`) 도입 | 사이드바 숨김만으로는 URL 직접 접근 우회 가능 |
| 카카오 알림톡 실연동 or 제거 결정 | 현재 UI만 있고 완전 mock |
| SEO 누락 키워드 보강 | 이미 준수한 수준, 개선 여지는 크지 않음 |
| `academy_memberships` 도입(멀티 역할/멀티 학원) | `docs/USER_MODEL_ARCHITECTURE.md` 기반, 장기 확장성 |
| `docs/ROLE_PERMISSION_DESIGN.md` 문서 갱신 | 코드가 문서를 앞서간 상태 정리 |
| ACA365식 기능 애드온 과금 모델 검토 | 비즈니스 판단 필요, 개발 우선순위 낮음 |

---

## 5. 수정 예상 파일

| 작업 | 파일 |
|------|------|
| 구독 프로모션 처리 | `lib/marketing/promoPricing.ts`, `lib/subscription/index.ts` |
| AI 가드레일 | `lib/ai/parentAgentPrompt.ts`, `lib/staffAgent.ts`, `lib/parentAgentSecurity.ts` |
| analytics 사이드바 gating | `lib/staffNavigation.ts` |
| 검색창 정리 | `components/navigation/GlobalSearchBar.tsx`, `components/TopNav.tsx` |
| env 예제 | `.env.example` |
| 일정 권한 | `lib/permissions.ts`, `lib/roles.ts`(DEFAULT_PERMISSIONS), `app/(app)/schedule/PageClient.tsx`, `components/schedules/ClassSchedulesSection.tsx`, `hooks/useClassSchedules.ts` |
| Teacher Scope 실적용 | `hooks/useStudents.ts`, `hooks/useClassSchedules.ts`, `hooks/useStaffScope.ts` |
| AI 토큰 UI | `components/TopNav.tsx`, `lib/aiUsage.ts`(read API 분리), 신규 `hooks/useAiUsage.ts`, 신규 `app/api/ai/usage/route.ts` |
| 학부모 연결 정리 | `lib/studentConnection.ts`, `components/portal/ConnectWithCodeForm.tsx`, `components/settings/ConnectionRequestsSection.tsx` (삭제 또는 라우팅) |
| 랜딩 CTA | `components/marketing/pages/HomePageContent.tsx` |
| 로그인 통일(방향 결정 후) | `components/auth/SignupForm.tsx`, `components/auth/LoginForm.tsx`, `lib/auth.ts` |
| Route/API 가드 | `lib/authRedirectPolicy.ts`, 신규 `lib/serverAuth.ts` |
| 직원 초대 정리 | `components/settings/PortalInviteSection.tsx`, `components/settings/AcademyConnectionCodeSection.tsx` |
| SEO 키워드 | `lib/marketing/seo.ts` |

---

## 6. 개발 순서 (권장)

1. **비즈니스 확인**: `PROMO_ALL_FREE` 의도 확인 (개발 착수 전 필수 — 사용자/이해관계자 확인 사항)
2. **P0 저리스크 수정 일괄 처리**: AI 가드레일 프롬프트, analytics gating, 검색창 정리, env 예제 — 이 4개는 서로 독립적이라 병렬 처리 가능, 하루 이내 완료 가능한 규모
3. **로그인 방식 방향 결정** (사용자 확정 필요, §2.6) → 확정 후 회원가입/로그인 리팩터링 착수
4. **일정 권한 구현** — permission key 추가 → DEFAULT_PERMISSIONS → UI 가드 → Teacher Scope 데이터 필터링까지 한 흐름으로 묶어서 진행(같은 도메인이라 분리하면 재작업 위험)
5. **AI 토큰 표시 UI** — read API 분리 후 TopNav 배지
6. **학부모 연결 코드 정리** — 삭제/유지 결정 후 정리
7. **랜딩 CTA + SEO 키워드** — 마케팅 사이드 작업, 개발 트랙과 병렬 가능
8. **Route/API 가드, 카카오 연동 결정, academy_memberships** — 중기 백로그로 이관

---

## 7. 예상 작업 시간 (개발자 1인 기준, 리뷰/QA 제외)

| 작업 | 예상 시간 |
|------|-----------|
| PROMO_ALL_FREE 처리 | 확인 30분 + 코드 조치 1시간 |
| AI 가드레일 프롬프트 수정 | 2~3시간 (프롬프트 튜닝 + 수동 테스트) |
| analytics gating 1줄 | 10분 |
| 검색창 제거/정리 | 30분 |
| .env.example 보강 | 10분 |
| 일정 권한 체계 (permission 추가 + UI 가드 + Teacher Scope 필터링) | 2~3일 |
| AI 토큰 표시 UI (API 분리 포함) | 1일 |
| 학부모 연결 코드 정리 | 반나절 |
| 랜딩 CTA 추가 | 반나절 |
| 로그인 방식 통일 (휴대폰 통일 기준) | 2~3일 (원장 가입 폼 교체 + 기존 이메일 계정 하위호환 처리) |
| 로그인 방식 통일 (이메일 통일 기준) | 4~5일 (학부모/학생 로그인 폼 전면 재작업 + 마이그레이션 필요, 비용 더 큼) |
| Route/API 레벨 가드 도입 | 3~4일 |
| 카카오 연동 실구현 (필요 시) | 별도 견적 필요 (외부 API 계약/승인 절차 포함) |
| SEO 키워드 보강 | 1시간 |

**P0+P1 전체 합산**: 대략 2~3주(1인 기준). P2까지 포함하면 별도 스프린트로 6~8주 규모.

---

## 8. 추가로 개선하면 좋을 점

- **서버 상태 관리 라이브러리 도입 검토**: 현재 50개 이상의 `hooks/use*.ts`가 각자 로딩/에러/refetch를 수동 구현하고 있음(§1.7). React Query 같은 라이브러리 도입은 이번 리뷰 범위 밖이지만 장기적으로 훅 보일러플레이트를 크게 줄일 수 있음.
- **DB 이중 경로 정리**: `classes.teacher_id` vs `class_teachers`, `lesson_logs` vs 정규화 테이블(`lessons`/`attendance_records`/`lesson_scores`) 등 `docs/USER_MODEL_ARCHITECTURE.md`가 이미 상세 마이그레이션 계획을 세워둔 상태 — 이번 요청 범위는 아니지만 방치하면 버그 유발 가능성이 계속 누적됨.
- **문서-코드 싱크**: `docs/ROLE_PERMISSION_DESIGN.md`처럼 "설계 시점" 문서가 실제 구현을 따라가지 못해 다음 개발자가 오래된 전제로 작업할 위험이 있음. 주요 설계 문서에 "최종 갱신: 구현 완료 커밋 XXX 반영" 같은 상태 라인을 추가하는 관행을 권장.
- **법정 교습비 영수증/현금영수증**: `docs/PRODUCT_GAPS.md`가 이미 지적한 "학원법 의무" 항목 — 실 결제 연동(PG) 작업과 묶어서 처리하는 게 효율적.
- **모바일 반응형(스탭 화면)**: `docs/PRODUCT_GAPS.md`가 지적한 대로 원장·강사 화면이 모바일에서 테이블/긴 폼 위주라 터치 최적화가 안 됨 — Flutter WebView로 접근하는 사용자가 많다면 우선순위가 생각보다 높을 수 있음.

</details>
