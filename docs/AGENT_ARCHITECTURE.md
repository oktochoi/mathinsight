# EduFlow Agent + RAG Architecture (AI Native)

## 개요

EduFlow는 **Vector RAG + Multi-Agent Workflow + Proactive Agent** 구조의 Education AI SaaS입니다.

| 레이어 | 역할 |
|--------|------|
| **Vector RAG** | 학생 기록 청크 → Gemini Embedding → pgvector 검색 → Parent AI Context |
| **Multi-Agent Workflow** | Risk → Counseling → Parent Agent 연결 실행 (`agent_jobs`) |
| **Proactive Agent** | 매일 Cron Risk Scan → 위험 학생 워크플로 자동 실행 |
| **Logs** | `agent_logs` — academy 단위 실행 이력 |

## DB 마이그레이션

| 파일 | 내용 |
|------|------|
| `016_agent_rag.sql` | `student_risk_signals`, `agent_logs` |
| `017_vector_rag_workflow.sql` | pgvector, `student_memory_chunks`, `agent_jobs`, RPC `match_student_memory_chunks` |
| `018_parent_memory_rag_read.sql` | 학부모 읽기 RLS (연결된 자녀 chunk만) |

Supabase SQL Editor에서 **016 → 017 → 018** 순서로 실행하세요. `vector` extension이 활성화되어 있어야 합니다.

## Vector RAG (학부모 AI)

```
질문 → Embedding (text-embedding-004, 768) → match_student_memory_chunks RPC
     → contextText → Gemini → 답변 + citations
```

- 청크 생성: `lib/vectorRag/chunkBuilder.ts` (수업·상담·리포트·위험신호·일정·메모·태그)
- 인덱싱: `POST /api/rag/index-student` (staff)
- 검색: `lib/vectorRag/search.ts`, `lib/rag/retrieve.ts` (vector 우선 → keyword fallback)
- API: `POST /api/parent-agent` — 응답에 `ragMode`, `citations` 포함
- UI: 학부모 포털 채팅 하단 「답변에 사용된 기록」

## Multi-Agent Workflow

```
Risk Agent → (상담/보강 권장 시) Counseling Agent → Parent Agent
```

- 오케스트레이션: `lib/workflows/studentCare.ts`
- 수동 실행: `POST /api/agents/workflow/run` `{ studentId }`
- 상태 조회: `GET /api/agents/workflow`
- 자동 산출물: `consultation_cards` (pending), `parent_reports` (Agent 초안 문구)

## Proactive Agent

- Cron: `GET /api/cron/proactive` — `vercel.json` 스케줄 `0 21 * * *` (UTC, KST 06:00)
- 헤더: `Authorization: Bearer {CRON_SECRET}` (설정 시 필수)
- 서비스 롤: `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase/admin.ts`)
- 피드·알림: `GET /api/agents/feed`
- 대시보드: Proactive 배너, Workflow 패널, Action Feed

## Agents API 요약

| Agent | API |
|-------|-----|
| Risk Detection | `POST /api/agents/risk`, 대시보드 `?refreshRisk=1` |
| Dashboard | `GET /api/agents/dashboard` |
| Counseling | `POST /api/agents/counseling` |
| Parent Communication | `POST /api/agents/parent-report/weekly` |
| Workflow | `POST /api/agents/workflow/run` |
| Vector Index | `POST /api/rag/index-student` |
| Parent RAG | `POST /api/parent-agent` |

## 환경 변수

```env
GEMINI_API_KEY=          # Embedding + Gemini
SUPABASE_SERVICE_ROLE_KEY=  # Cron / proactive
CRON_SECRET=             # Vercel Cron 인증 (권장)
```

## 발표용 한 줄

학생 데이터를 Vector RAG로 검색해 Gemini에 전달하고, Risk Agent가 위험을 감지하면 Counseling·Parent Agent가 연쇄 실행되며, Cron Proactive Agent가 먼저 상담·리포트 초안을 준비하는 **AI Native Education OS** 구조입니다.
