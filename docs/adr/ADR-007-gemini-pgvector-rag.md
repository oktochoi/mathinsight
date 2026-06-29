# ADR-007: Gemini + pgvector RAG

- **Status:** Accepted
- **Context:** 학부모 질문·Agent 생성에 LLM·근거 검색 필요.
- **Decision:** Google Gemini (생성 + `text-embedding-004`). pgvector `student_memory_chunks` + RPC. keyword fallback in `lib/rag/retrieve.ts`.
- **Consequences:** `GEMINI_API_KEY` 서버 only. Cron/Proactive는 `SUPABASE_SERVICE_ROLE_KEY`.
- **Alternatives:** OpenAI only — embedding 차원·마이그레이션 재작업.

→ [AGENT_ARCHITECTURE.md](../AGENT_ARCHITECTURE.md)
