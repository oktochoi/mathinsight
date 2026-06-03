# Supabase 설정

**사이트 사용 방법(역할별 예시):** [USAGE_GUIDE.md](./USAGE_GUIDE.md)

## 1. SQL 마이그레이션

Supabase Dashboard → **SQL Editor**에서 다음 파일을 실행하세요:

1. `supabase/migrations/001_initial_schema.sql`
2. **`supabase/migrations/002_auth_user_trigger.sql`** ← 회원가입 401 방지 (필수)
3. **`supabase/migrations/003_classes_portal_link.sql`** ← 반 삭제·학부모/학생 계정 조회 (포털 연결)
4. **`supabase/migrations/004_backfill_existing_profiles.sql`** ← 예전에 가입한 계정 프로필 복구
5. **`supabase/migrations/005_ensure_user_profile_rpc.sql`** ← **필수 권장** 로그인·가입 시 프로필 자동 생성
6. **`supabase/migrations/006_fix_users_rls_recursion.sql`** ← users RLS 무한 재귀 수정 (003 이후 **필수**)
7. **`supabase/migrations/007_student_portal_emails.sql`** ← 학부모/학생 이메일 저장·계정 조회 RPC
8. **`supabase/migrations/008_schedules_and_followups.sql`** ← 반별 수업 일정·예외·상담 후 확인
9. **`supabase/migrations/009_profile_setup_pending.sql`** ← Google·이메일 가입 후 역할 선택 (권장)
10. **`supabase/migrations/010_owner_role_alias.sql`** ← UI 역할 `owner` ↔ DB `admin` 매핑
11. **`supabase/migrations/011_student_connection_codes.sql`** ← 연결 요청·승인 (기반)
12. **`supabase/migrations/012_academy_connection_code.sql`** ← **학원당 연결 코드 1개** (011 이후 필수)

### 공모전·발표 시연용 시드 (`seed-eduflow-demo.sql`)

자세한 절차: **`docs/DEMO_SETUP.md`**

1. `npm run demo:auth` (또는 `/auth`에서 3계정 가입)
2. SQL Editor에서 **`supabase/seed-eduflow-demo.sql`** 실행

### 레거시 시드 (`seed-demo.sql` — 사용 비권장)

1. Auth에 `okto0914@gmail.com`(admin), `okto0915@gmail.com`(parent), `okto0916@gmail.com`(student) 가입
2. SQL Editor에서 **`supabase/seed-demo.sql`** 전체 실행
3. 각 계정으로 로그인해 대시보드·시간표·박서연 학생·학부모/학생 포털 확인

비밀번호: `okto0914!` (3계정 동일)

### `infinite recursion detected in policy for relation "users"`

003의 `users_staff_lookup_portal` 정책이 `users` 테이블을 다시 읽어 RLS가 무한 루프에 빠집니다.  
**`006_fix_users_rls_recursion.sql`** 을 SQL Editor에서 실행하세요.

### 가입 직후 「프로필이 아직 없습니다」

회원가입 폼에 **프로필 입력 칸은 없습니다.** 이름·(원장) 학원 이름이 DB 프로필로 자동 변환됩니다.

1. SQL Editor에서 **002 + 005** 실행 (`.env.local`과 **같은 Supabase 프로젝트**인지 확인)
2. 앱 새로고침 후 **로그인** (앱이 프로필을 자동 생성 시도)
3. 그래도 안 되면 **004** 실행 후 다시 로그인

## 2. 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

### Google 로그인

Supabase·Google Cloud 설정은 **[docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md)** 를 따르세요. Client Secret은 Dashboard에만 넣습니다.

## Next.js 렌더링

- `next.config.ts`에 **`output: "export"` 사용하지 않음** (Supabase Auth·middleware 필수)
- 로그인·앱·포털 라우트: `export const dynamic = 'force-dynamic'`
- `/students/[id]`: `dynamicParams = true` (DB 학생 ID만 유효)
- 데이터 페이지는 모두 **`'use client'`** + Supabase hooks

## Supabase 클라이언트 경로

| 용도 | import |
|------|--------|
| Client Component | `import { createClient } from '@/utils/supabase/client'` |
| Server Component | `import { createClient } from '@/utils/supabase/server'` + `cookies()` |
| Middleware | `import { createClient } from '@/utils/supabase/middleware'` |

Server Page 예시: `app/(app)/dashboard/page.tsx`

## 3. Auth

- **로그인·가입** (`/auth`): Google 또는 이메일 → 최초 **`/auth/choose-role`** 에서 역할·(원장) 학원 이름 확정
- 역할 확정 후 `/dashboard`, `/parent`, `/student`로 이동 (`/login`, `/signup`은 `/auth`로 연결)

### 회원가입 `POST /users` 401 (Unauthorized)

클라이언트에서 `users` 테이블에 직접 INSERT하면, **이메일 인증 ON**일 때 세션이 없어 RLS에 막힙니다.

**해결:** `002_auth_user_trigger.sql`을 실행하면 Auth 가입 시 DB가 자동으로 `users`(·원장이면 `academies`, `classes`)를 만듭니다.

### 기존에 만든 계정도 프로필이 필요한가?

**예.** 로그인은 Supabase **Auth**(`auth.users`)와 앱 DB **`public.users`**가 **같은 UUID**로 짝을 이뤄야 합니다.

| 상황 | 설명 |
|------|------|
| 002 실행 **후** 새로 가입 | 트리거가 자동으로 `public.users` 생성 |
| 002 실행 **전**에 가입한 계정 | Auth만 있고 `public.users` 없음 → 로그인 시 「프로필이 없습니다」 |
| 해결 | SQL Editor에서 **`004_backfill_existing_profiles.sql`** 실행 (또는 Table Editor에서 `users` 행 수동 추가) |

원장 계정은 가입 시 넣었던 `academy_name` 메타데이터가 있으면 004가 학원·A반까지 만들어 줍니다. 메타데이터가 없으면 Table Editor에서 `users` + `academies`를 수동으로 맞춰 주세요.

이미 Auth만 있고 `public.users`가 없는 계정은 **004 실행**을 권장합니다. 삭제 후 재가입은 마지막 수단입니다.

### 회원가입 429 (Too Many Requests)

Supabase Auth는 **같은 IP/이메일로 짧은 시간에 여러 번 signUp** 하면 429를 반환합니다.

**대처:**

1. **1~2분 기다린 뒤** 다시 시도 (이미 가입됐을 수 있으면 `/login` 사용)
2. Supabase Dashboard → **Authentication** → **Rate Limits** 에서 한도 확인 (플랜별 상이)
3. 개발 시 **이메일 인증 끄기**: Authentication → Providers → Email → **Confirm email** 비활성화  
   (끄면 signUp 직후 세션이 생겨 추가 `signIn` 호출이 줄어듦)
4. `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`이 사용 중인 프로젝트(`vzmdggsmuatyqvxqfkdc` 등)와 **동일한지** 확인

## 4. 학부모/학생 포털 연결

1. 학부모·학생이 각각 **학부모** / **학생** 역할로 `/signup` 회원가입
2. 원장: **Settings → 반 관리**에서 반 추가·삭제
3. 원장: **Students → 학생 수정** → 학부모/학생 **가입 이메일** 입력 후 저장
4. 연결 후 학부모는 `/parent`, 학생은 `/student`에서 해당 학생 데이터 조회

`003_classes_portal_link.sql`이 없으면 이메일로 계정을 찾지 못할 수 있습니다.

## 5. Gemini AI (학부모 리포트·상담 카드)

`.env.local`에 서버 전용 키를 넣습니다 (클라이언트에 노출 금지).

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
```

- 프롬프트: `lib/ai/prompts.ts`
- API: `POST /api/ai/generate` (`task`: `learningSummary` | `evidenceSummary` | `consultationPoints` | `parentMessage` | `parentReport`)
- 키가 없거나 API 실패 시 `lib/reportGenerator.ts` 규칙 기반으로 자동 폴백
