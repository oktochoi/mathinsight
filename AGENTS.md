# AGENTS — EduFlow 개발 진입점

**EduFlow:** AI Native 학원 운영 SaaS (운영 60 · AI 25 · 상담 15)

---

## 읽기 순서

1. [PROJECT_GOALS.md](./PROJECT_GOALS.md) — **왜** 만드는지 (Business Goals 포함)
2. **화면을 재설계·리디자인하는 작업이면 먼저** [docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md](./docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md) — 시각 규칙이 아니라 판단 기준. 아래 3~4번의 색상·컴포넌트·레이아웃 관습은 버려도 되지만 이 문서의 철학은 화면 구조·메시지·카피에 반드시 드러나야 한다
3. [docs/DESIGN_PRINCIPLES.md](./docs/DESIGN_PRINCIPLES.md) — UI/UX 원칙 (필요 시)
4. [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) — Staff 공통 컴포넌트·토큰 (UI 작업 시)
5. 작업 유형 → 아래 **Skill** + **Rule**
6. 필요할 때만 [docs/architecture.md](./docs/architecture.md)
7. 설계 선택이 궁금할 때만 [docs/adr/](./docs/adr/) 해당 파일 **1개**

전체 `docs/*.md`를 한 번에 읽지 마세요.

---

## Shell 지도

| Shell | 경로 | 수정 시 Rule |
|-------|------|--------------|
| Staff ERP | `app/(app)/` | frontend |
| 마케팅 | `app/(marketing)/` | frontend (Marketing 금지 혼용) |
| 학부모 | `app/parent/` | frontend |
| 학생 | `app/student/` | frontend |
| Auth | `app/(auth)/`, `app/auth/` | frontend + backend |
| API | `app/api/` | backend |
| DB | `supabase/`, `types/database.ts` | database |

레이아웃: Staff `AppShell` · Portal `ParentShell`/`StudentShell` · Auth `AuthShell` · Marketing `MarketingShell`

---

## 디렉터리 치트시트

| 용도 | 경로 |
|------|------|
| 사이드바 IA | `lib/staffNavigation.ts` |
| 페이지 메타 | `lib/staffPages.ts` |
| 도메인 로직 | `lib/*.ts`, `lib/agents/`, `lib/analytics.ts`, `lib/learningFlow.ts` |
| 데이터 훅 | `hooks/use*.ts` |
| 타입 | `types/database.ts` |
| 인증·미들웨어 | `proxy.ts`, `lib/middlewareAuth.ts`, `lib/api/staffAuth.ts` |
| 전역 캐시 | `store/useAppStore.ts` (`dataVersion`) |

---

## 작업 라우팅

| 하려는 일 | Skill | Rule | Deep doc (필요 시만) |
|----------|-------|------|----------------------|
| Staff 화면 | [skills/create-page.md](./skills/create-page.md) | frontend | [PRODUCT_IA.md](./docs/PRODUCT_IA.md) |
| Supabase 훅 | [skills/create-hook.md](./skills/create-hook.md) | frontend, database | — |
| API / Agent | [skills/create-api.md](./skills/create-api.md) | backend, database | [AGENT_ARCHITECTURE.md](./docs/AGENT_ARCHITECTURE.md) |
| SQL / RLS | — | database | [OPERATIONS_SYSTEMIZATION.md](./docs/OPERATIONS_SYSTEMIZATION.md) |
| ERP 이중 DB | — | database | [ADR-001](./docs/adr/ADR-001-dual-database.md) |
| 마케팅 페이지 프리미엄 UI/시네마틱 히어로 | Claude Code 스킬 `premium-web-experience` (자동 트리거) | frontend (marketing 셸만) | 아래 "하네스: 프리미엄 마케팅 UI" |

---

## 하네스: 프리미엄 마케팅 UI

**목표:** `app/(marketing)/` 랜딩 페이지에 "10K 사이트"·"어워드 사이트" 급 프리미엄 UI(커서/메뉴/캐러셀/마이크로 인터랙션/타이포그래피/스크롤 스토리텔링/시네마틱 히어로)를 기존 스택(Framer Motion + Lenis)으로 구현.

**트리거:** 마케팅/랜딩 페이지를 고급스럽게·프리미엄하게 만들거나 커서·메뉴·캐러셀·스크롤 애니메이션·시네마틱 히어로 등을 요청받으면 `premium-web-experience` 스킬(`.claude/skills/premium-web-experience/`)을 사용하라. 이 스킬은 `premium-ui-builder`, `cinematic-asset-pipeline` 두 에이전트(`.claude/agents/`)를 조율한다. 시네마틱 히어로 파이프라인은 Google Whisk/ezgif 같은 브라우저 외부 툴 작업이 포함되므로, 매 단계 사용자에게 설명·요청 후 완료 확인을 받아야만 진행한다 — 이는 프로젝트 절대 규칙(Staff/Marketing/Portal UI 혼용 금지, 최소 diff, 한국어 카피)과 함께 지켜야 한다.

**필수 입력:** 표면적 이펙트 적용 이전에 [docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md](./docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md)를 반드시 먼저 참조한다 — 이 하네스는 "10K 사이트처럼 화려하게"가 목적이 아니라, 제품 철학("재등록을 지키는 AI 상담 인프라", 운영60·AI25·상담15, 차분한 확신)을 사용자가 화면에서 실제로 경험하게 만드는 것이 목적이다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-10 | 초기 구성 | 전체 (`premium-ui-builder`, `cinematic-asset-pipeline` 에이전트 + 3개 스킬) | 10K/어워드 사이트/Castimedia 인터랙티브 가이드 3개 PDF 기반, 마케팅 UI 고도화 요청 |
| 2026-07-10 | 제품 철학 그라운딩 단계 추가 | 에이전트 2개 + 오케스트레이터 스킬 + `docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md` 신설 | 시각 시스템은 재설계해도 되나 제품 철학(존재 이유·차별점·핵심 감정)은 가볍게 취급하지 말고 오히려 가장 중요한 설계 원천으로 삼으라는 사용자 지시 반영 |

---

## ADR 인덱스

| ADR | 주제 |
|-----|------|
| [001](./docs/adr/ADR-001-dual-database.md) | lesson_logs + ERP 이중 구조 |
| [002](./docs/adr/ADR-002-no-react-query.md) | React Query 미사용 |
| [003](./docs/adr/ADR-003-pageclient-pattern.md) | PageClient 패턴 |
| [004](./docs/adr/ADR-004-no-shadcn.md) | shadcn 미사용 |
| [005](./docs/adr/ADR-005-separated-ui-shells.md) | Shell별 UI 분리 |
| [006](./docs/adr/ADR-006-ai-as-assistant-not-hero.md) | AI 조력자 포지션 |
| [007](./docs/adr/ADR-007-gemini-pgvector-rag.md) | Gemini + pgvector |
| [008](./docs/adr/ADR-008-distributed-settings-ia.md) | 설정 기능 분산 |

새 ADR: `docs/adr/ADR-NNN-slug.md` 추가, 이 표에 한 줄 등록.

---

## 절대 규칙 (요약)

- UI 카피 **한국어** · **최소 diff**
- `academy_id` + teacher **scope** (`useStaffScope`) 필수
- `(app)` / `(marketing)` / portal **UI 혼용 금지**
- Staff 신규 메뉴 → `staffNavigation.ts`
- 튜토리얼·StaffPageIntro **임의 추가 금지**
- 기존 doc **복사 금지** — 링크만
- 리디자인 시 **시각 시스템(색상·컴포넌트·레이아웃 관습)은 버려도 되지만, [제품 철학](./docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md)은 계승·강화** — 디자인을 철학의 포장지가 아니라 철학을 경험하게 하는 수단으로 다룰 것

상세: `.cursor/rules/core.mdc`

---

## 기존 문서 (Deep Reference)

| 문서 | 용도 |
|------|------|
| [README.md](./README.md) | 운영자·데모·env (개발 Agent는 Goals/architecture 우선) |
| [EDUFLOW.md](./docs/EDUFLOW.md) | 제품 로드맵 |
| [PRODUCT_IA.md](./docs/PRODUCT_IA.md) | IA 분석 |
| [PRODUCT_STRATEGY_REPOSITION.md](./docs/PRODUCT_STRATEGY_REPOSITION.md) | 상담·재등록 포지션 |
| [OPERATIONS_SYSTEMIZATION.md](./docs/OPERATIONS_SYSTEMIZATION.md) | ERP·마이그레이션 |
| [AGENT_ARCHITECTURE.md](./docs/AGENT_ARCHITECTURE.md) | Agent·RAG·API |
| [WEBSITE_IA.md](./docs/WEBSITE_IA.md) | 마케팅 IA |
| [DEMO_SETUP.md](./docs/DEMO_SETUP.md) | 시드·데모 계정 |

---

## 스택 (한 줄)

Next.js 16 · React 19 · TypeScript · Supabase · Tailwind · Gemini · recharts · Zustand

---
## Development Server Check

Do NOT repeatedly inspect the Next.js development log after every small edit.

Only check the development server when:

- A task is completed
- A build-related file is modified
- A runtime error is expected
- The user explicitly asks to verify

Avoid repeatedly running:

tail -30 /tmp/nextjs-dev.log

after every edit.

Instead, batch related changes together and verify once.

---
## Task Size Rule

Never refactor multiple major screens in one task.

Only work on ONE page or ONE component hierarchy at a time.

Every task must be independently reviewable.

Do not modify unrelated files.

Complete one refactor before starting the next.

Prefer:
- Today Workspace
- Dashboard
- Student Detail

instead of large multi-page refactors.

The goal is incremental product improvements without breaking the existing workflow.