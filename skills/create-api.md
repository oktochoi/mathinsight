# Skill: API Route 생성

**When:** `app/api/**/route.ts` 신규 — Agent, AI, cron, staff action.

**Not for:** 클라이언트 Supabase 직접 호출로 충분한 CRUD (→ create-hook).

---

## Checklist

1. [ ] `app/api/<path>/route.ts`
2. [ ] Staff: `createClient`(cookies) + `requireStaff()` — 401/403 처리
3. [ ] Cron/admin: service role + `CRON_SECRET` (해당 시)
4. [ ] 비즈니스 로직 → `lib/` (Route thin)
5. [ ] Agent: `agent_logs` 기록
6. [ ] `NextResponse.json({ ok: true, ... })` / `{ ok: false, error }`
7. [ ] `GEMINI_*` env — server only

---

## 패턴

```ts
export async function POST() {
  try {
    const supabase = createClient(await cookies());
    const auth = await requireStaff(supabase);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const result = await domainFn(supabase, auth.academyId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: ... }, { status: 500 });
  }
}
```

참고: [app/api/agents/risk/route.ts](../app/api/agents/risk/route.ts) · [AGENT_ARCHITECTURE.md](../docs/AGENT_ARCHITECTURE.md)

---

## 금지

- Route에 대량 Supabase/LLM 로직 인라인
- Staff API without `requireStaff`
- 클라이언트에 secret 노출
