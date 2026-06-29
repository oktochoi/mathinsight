# Architecture — EduFlow

> **허브 문서.** 상세는 링크된 deep doc 또는 ADR만 읽으세요.

---

## 레이어

```
UI (PageClient, components)
    ↓ hooks / AuthContext
lib/* (domain, analytics, agents, rag)
    ↓
Supabase client (RLS)          app/api/* (Gemini, Cron, service role)
```

---

## Route Shells

| Group | Layout | 역할 |
|-------|--------|------|
| `(app)` | AppShell + Sidebar | owner/teacher ERP |
| `(marketing)` | MarketingShell | 공개 사이트 |
| `parent` / `student` | ParentShell / StudentShell | 포털 |
| `(auth)` | AuthShell | login/signup |

인증 게이트: [proxy.ts](../proxy.ts) · [lib/middlewareAuth.ts](../lib/middlewareAuth.ts)

---

## 데이터 흐름 (일일 운영)

```
class_schedules + exceptions
    → 오늘 수업 (lesson-logs)
    → lesson_logs (+ ERP sync: lessons, attendance_records)
    → lib/analytics, lib/learningFlow
    → Dashboard / retention / counseling
    → Agent + RAG index → parent portal
```

이중 DB: [adr/ADR-001-dual-database.md](./adr/ADR-001-dual-database.md) · ERP: [OPERATIONS_SYSTEMIZATION.md](./OPERATIONS_SYSTEMIZATION.md)

---

## 역할·스코프

| Role | 진입 | 데이터 |
|------|------|--------|
| owner | `/dashboard` | academy 전체 |
| teacher | `/dashboard` | `useStaffScope` — 담당 반/학생 |
| parent | `/parent` | 연결 자녀 |
| student | `/student` | 본인 |

API: [lib/api/staffAuth.ts](../lib/api/staffAuth.ts) `requireStaff()`

---

## AI / Agent

Risk → Counseling → Parent workflow · Vector RAG · Cron proactive

→ [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) · [ADR-007](./adr/ADR-007-gemini-pgvector-rag.md)

---

## Deep Reference

| Topic | Doc |
|-------|-----|
| 제품·로드맵 | [EDUFLOW.md](./EDUFLOW.md) |
| IA | [PRODUCT_IA.md](./PRODUCT_IA.md) |
| ERP 마이그레이션 | [OPERATIONS_SYSTEMIZATION.md](./OPERATIONS_SYSTEMIZATION.md) |
| Agent API | [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) |
| 마케팅 IA | [WEBSITE_IA.md](./WEBSITE_IA.md) |
| 설계 결정 | [adr/](./adr/) |

---

## Harness

- 진입: [AGENTS.md](../AGENTS.md)
- 목표: [PROJECT_GOALS.md](../PROJECT_GOALS.md)
- Rules: `.cursor/rules/`
- Skills: `skills/`
