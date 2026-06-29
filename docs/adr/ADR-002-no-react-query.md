# ADR-002: React Query 미사용

- **Status:** Accepted
- **Context:** 데이터는 Supabase client + 커스텀 hooks. 전역 무효화 필요.
- **Decision:** `hooks/use*.ts` + Zustand `useAppStore.dataVersion` / `bumpDataVersion()` 패턴 유지. React Query 도입 안 함.
- **Consequences:** mutation 후 `bumpDataVersion()` 호출 일관성 필요.
- **Alternatives:** React Query — 캐시 계층 중복, 마이그레이션 비용.
