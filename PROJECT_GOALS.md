# EduFlow — Project Goals

> 철학·목표만 담습니다. 구현·IA 상세는 [docs/architecture.md](./docs/architecture.md)와 기존 `docs/*`를 참조하세요.

---

## Business Goals

### 해결하는 핵심 문제

- 학원 운영 데이터(출결·숙제·성적·상담·학부모 소통)가 **카톡·메모·엑셀·개인 기억**에 흩어져 있다.
- 원장은 **「오늘 학원을 어떻게 운영할지」** 보다 **「누구를 상담할지」**를 먼저 찾느라 시간을 쓴다.
- 상담·재등록·학부모 신뢰가 **수업 기록과 연결되지 않아** 재등록 손실을 사후에야 알게 된다.

### 고객이 돈을 내는 이유

- **운영 시간 절감:** 출근 후 3초 안에 오늘 할 일 파악, 한 화면(오늘 수업)에서 기록 입력.
- **재등록 방어:** 위험 학생·미납·출결·숙제 신호를 **일찍** 보고 상담·학부모 대응.
- **학부모 신뢰:** 근거 있는 리포트·문의 응답(RAG·Agent 초안)으로 **「체계적인 학원」** 인상.
- **강사 온보딩:** 담당 반만 보는 업무판 — ERP 전체를 배울 필요 없음.

### KPI (제품·고객 성공 지표)

| KPI | 의미 |
|-----|------|
| **재등록률** | 학기/분기 재등록 유지 — 핵심 North Star에 가깝 |
| **상담 리드타임** | 신호 발생 → 상담 완료까지 걸리는 시간 |
| **원장·강사 운영시간** | 출결·숙제·일일 마감에 쓰는 시간 |
| **학부모 만족도** | 문의 응답 속도, 리포트 열람·피드백 |
| **기록 완성도** | 오늘 수업 마감률, 출결·숙제 입력률 |
| **Agent 활용률** | 상담 준비·문의 초안 사용 비율 (AI는 조력) |

### 향후 SaaS 방향

- **수학학원 파일럿 → 다학원 B2B SaaS** (academy 단위 멀티테넌트 이미 Supabase RLS 기반).
- **운영 OS + AI 레이어:** Vector RAG, Risk→Counseling→Parent Agent, Proactive Cron.
- **포털 확장:** 학부모·학생 self-service, ERP(결제·공지·일정) 점진 통합.
- **마케팅 사이트**와 **앱** 분리 유지 — 세일즈 IA는 [docs/WEBSITE_IA.md](./docs/WEBSITE_IA.md).

### 과금 전략 (방향)

- **학원(academy) 단위 구독** — 학생 수 또는 반 수 티어 (미확정, 코드와 분리).
- **AI·Agent·RAG 고급 기능** — 상위 플랜 또는 사용량 기반 (Gemini 비용 반영).
- **파일럿/데모** — 제한 학생 수 + 시드 데이터 ([README.md](./README.md) 데모 절).

### 성공 지표 (내부)

- 원장이 Dashboard만으로 **오늘 운영 우선순위**를 설명할 수 있다.
- `lesson_logs` 입력 → Dashboard·상담·재등록 신호가 **같은 날** 반영된다.
- Agent/RAG는 **운영을 대체하지 않고** 상담·문의 시간을 줄인다.

---

## 제품 철학

- **Lesson-first:** 하루는 「오늘 수업」에서 시작한다.
- **운영 60 · AI 25 · 상담 15:** Dashboard는 학원 운영판, AI는 Assistant Layer, 상담은 운영 흐름 안에서.
- **student_id 중심:** 모든 신호는 학생에게 수렴, 입력은 전용 화면·조회는 학생 상세.
- **4역할:** owner/teacher/parent/student — shell·scope·리다이렉트 분리.

→ IA·메뉴: [docs/PRODUCT_IA.md](./docs/PRODUCT_IA.md), [lib/staffNavigation.ts](./lib/staffNavigation.ts)

---

## 개발 철학

- **최소 diff** — 요청 범위 밖 수정 금지.
- **허브 문서** — Harness·architecture는 링크만, 기존 `docs/*` 본문 복사 금지.
- **패턴 고정** — Staff `PageClient`, hooks+Supabase, `dataVersion` 무효화.
- **이중 DB 인지** — `lesson_logs` ↔ ERP 테이블; [docs/adr/ADR-001-dual-database.md](./docs/adr/ADR-001-dual-database.md).
- **커밋·README 대규모 수정** — 사용자 요청 시만.

---

## UI 철학

| Shell | 톤 |
|-------|-----|
| `(app)` Staff | 운영 위젯 + AI Assistant Layer (25%), B2B Data UI |
| `(marketing)` | Carefor 스타일 — [lib/marketing/ui.ts](./lib/marketing/ui.ts) |
| `parent` / `student` | 포털 stone 톤 |
| `(auth)` | AuthShell, 마케팅 헤더 없음 |

→ Design Principles: [docs/DESIGN_PRINCIPLES.md](./docs/DESIGN_PRINCIPLES.md)

- **튜토리얼·설명 배너** — 앱 본문에 넣지 않음 (온보딩은 추후 별도).
- **설정에 기능 몰지 않음** — 반→학생, 일정→시간표 등 각 메뉴로 분산.

---

## AI 철학

- **AI Native SaaS** — ERP가 아닌, AI Assistant Layer가 차별점 (Dashboard 25% 비중).
- **AI ≠ 화면 지배** — 운영 판단 옆에서 조용히 도움 (추천 업무 · 운영 요약 · 상담 준비).
- UI 용어: AI 운영 요약, AI 추천 업무, 학생 요약, 상담 준비 메모 (RAG/Agent/Gemini 노출 금지).
- **상세:** [docs/AGENT_ARCHITECTURE.md](./docs/AGENT_ARCHITECTURE.md) (개발자용)

---

## Non-goals (절대 하지 않을 것)

- 범용 ERP UI (메뉴 18+ 나열, KPI 과밀)
- Dashboard를 **상담 전용**으로 되돌리기
- React Query / shadcn 도입 (ADR 참조)
- FastAPI 등 **별도 백엔드** 추가
- Marketing 컴포넌트를 Staff 앱에 혼용
- Agent Architecture 패널·튜토리얼 블록 **임의 재도입**
- Harness/Goals에 README 운영 절차 **전문 복사**
- ADR 없이 **스키마·IA 철학** 변경
