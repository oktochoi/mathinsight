# Google 로그인 (Supabase OAuth)

EduFlow는 **Supabase Auth**가 Google OAuth를 처리합니다. Client Secret은 **Supabase Dashboard**에만 넣고, Next.js `.env.local`에는 넣지 않습니다.

## 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**
2. OAuth 2.0 Client ID (Web application)
3. **Authorized JavaScript origins**
   - `https://eduflowclass.com`
   - (로컬 개발 시) `http://localhost:3000`
4. **Authorized redirect URIs** (Supabase만 — 앱이 아님)
   - `https://vzmdggsmuatyqvxqfkdc.supabase.co/auth/v1/callback`
   - 프로젝트 URL이 다르면 Dashboard → Authentication → URL Configuration 의 callback URL 사용

## 2. Supabase Dashboard

**Authentication → Providers → Google**

| 항목 | 값 |
|------|-----|
| Enable | ON |
| Client ID | Google Console에서 발급 |
| Client Secret | Google Console에서 발급 |

**Authentication → URL Configuration**

| 항목 | 로컬 개발 |
|------|-----------|
| Site URL | `https://eduflowclass.com` |
| Redirect URLs | `https://eduflowclass.com/auth/callback` |

로컬 개발 시 위 URL에 `http://localhost:3000` 및 `http://localhost:3000/auth/callback` 추가.

배포 시 Site URL·Redirect URLs에 프로덕션 도메인을 추가합니다.

## 3. 앱 환경 변수

`.env.local`:

```env
# Vercel Environment Variables에도 동일하게 설정
NEXT_PUBLIC_SITE_URL=https://eduflowclass.com
```

`npm run dev`가 `-H 0.0.0.0`이어도 OAuth는 이 env를 사용합니다. **0.0.0.0을 Redirect URL에 넣지 마세요.**

(Supabase URL·Anon 키는 기존과 동일)

## 4. SQL (역할 선택 플로우)

SQL Editor에서 **`supabase/migrations/009_profile_setup_pending.sql`** 실행 (가입 직후 자동 `parent` 프로필 생성 방지).

## 5. 동작 확인

1. `npm run dev` → `http://localhost:3000/auth`
2. **Google로 계속하기** → 최초 가입 시 **`/auth/choose-role`** 에서 원장·학부모·학생 선택
3. 이메일 가입도 동일하게 역할 선택 후 해당 포털로 이동

## 5. 보안

- Client Secret이 채팅·Git에 노출되었다면 Google Console에서 **시크릿 재발급** 후 Supabase에 다시 저장하세요.
- 시크릿은 저장소에 커밋하지 마세요.

## 관련 코드

- `lib/auth.ts` — `signInWithGoogle`
- `app/auth/callback/route.ts` — PKCE 세션 교환·프로필 보정
- `components/auth/GoogleSignInButton.tsx`
