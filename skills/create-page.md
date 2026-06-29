# Skill: Staff 페이지 생성

**When:** `app/(app)/` 신규 화면, 탭 페이지, 대규모 Staff UI 개편.

**Not for:** Marketing, Portal, Auth-only, API-only, 단순 Dashboard 위젯 수정.

---

## Checklist

1. [ ] `app/(app)/<route>/page.tsx` — default export, Server wrapper
2. [ ] `app/(app)/<route>/PageClient.tsx` — `'use client'`
3. [ ] `PageHeader` — **title만** (description/튜토리얼 없음)
4. [ ] `PageLoader` / `ErrorBanner` / `EmptyState` from `@/components/ui/DataStates`
5. [ ] 데이터: 기존 `hooks/use*.ts` 재사용 또는 [create-hook.md](./create-hook.md)
6. [ ] 신규 사이드바 항목 → `lib/staffNavigation.ts`
7. [ ] 탭 필요 시 → `?tab=` + nav Link, `useSearchParams` + `Suspense` in page
8. [ ] `npm run build` 통과

---

## 패턴

```
page.tsx          → import PageClient; export default function Page() { return <PageClient /> }
PageClient.tsx    → PageHeader + 본문 + hooks
```

참고: [ADR-003](../docs/adr/ADR-003-pageclient-pattern.md) · 기존 예: `lesson-logs/PageClient.tsx`, `students/PageClient.tsx`

---

## 금지

- Marketing/Portal 컴포넌트 import
- `StaffPageIntro` 추가
- `staffNavigation` 없이 orphan 라우트
