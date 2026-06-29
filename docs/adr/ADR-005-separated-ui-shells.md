# ADR-005: Shell별 UI 분리

- **Status:** Accepted
- **Context:** Staff ERP, 마케팅(Carefor), 포털, Auth가 목적·토큰이 다름.
- **Decision:** Shell마다 layout·토큰 분리. `(app)` 컴포넌트를 `(marketing)`/`parent`에 import 금지.
- **Consequences:** 마케팅: `lib/marketing/ui.ts`. Staff: slate/indigo. Portal: stone/parent-card.
- **Alternatives:** 단일 디자인 시스템 — Carefor·운영 Dashboard 요구 충돌.
