# Skill: Supabase Hook 생성

**When:** academy-scoped CRUD/목록/집계 훅 신규.

**Not for:** API Route 대체(기본), Server Component fetch, React Query.

---

## Checklist

1. [ ] `hooks/use<Name>.ts` — `'use client'`
2. [ ] `useAuth()` → `profile?.academy_id` 없으면 early return + 빈 상태
3. [ ] Teacher scope: `useStaffScope()` 필터 (해당 시)
4. [ ] `useAppStore(s => s.dataVersion)` 구독 → refetch
5. [ ] mutation 성공 → `bumpDataVersion()`
6. [ ] 에러 메시지 **한국어**
7. [ ] 반환: `{ data, loading, error, refetch, ...mutations }`

---

## 패턴

```ts
const { profile } = useAuth();
const dataVersion = useAppStore((s) => s.dataVersion);
const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

const load = useCallback(async () => {
  if (!profile?.academy_id) return;
  // supabase.from(...).eq('academy_id', profile.academy_id)
}, [profile?.academy_id]);

useEffect(() => { load(); }, [load, dataVersion]);
```

참고: [useStudents.ts](../hooks/useStudents.ts) · [ADR-002](../docs/adr/ADR-002-no-react-query.md)

---

## 금지

- `@tanstack/react-query`
- academy_id 없는 쿼리
- teacher에게 전체 academy 데이터
