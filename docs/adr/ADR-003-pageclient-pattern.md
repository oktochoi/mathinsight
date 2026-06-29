# ADR-003: PageClient 패턴 (Staff 페이지)

- **Status:** Accepted
- **Context:** Staff ERP 페이지 20+. Server/Client 경계·searchParams 혼재.
- **Decision:** `app/(app)/**/page.tsx` — thin (Server). `PageClient.tsx` — `'use client'` + 로직. `PageHeader` + `DataStates`.
- **Consequences:** 탭·필터는 `useSearchParams` + Suspense. 신규 Staff 화면은 Skill [create-page.md](../../skills/create-page.md) 따름.
- **Alternatives:** RSC-only fetch — hooks·Supabase client 패턴과 충돌.
