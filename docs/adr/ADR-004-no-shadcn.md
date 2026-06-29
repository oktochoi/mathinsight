# ADR-004: shadcn / Radix 미사용

- **Status:** Accepted
- **Context:** Tailwind + 인라인 컴포넌트로 전 앱 구축. `@radix-ui`, `components.json` 없음.
- **Decision:** shadcn 도입하지 않음. 공통 UI는 `components/ui/*`, Dashboard는 `DashboardPrimitives`.
- **Consequences:** Dialog/Form primitive 없음 — 기존 패턴(모달 state, native input) 유지.
- **Alternatives:** shadcn 도입 — 디자인 시스템 이중화.
