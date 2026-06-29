'use client';

import { cn } from '@/lib/cn';

/** 전역 검색 UI 자리 — 실제 검색 로직은 후속 작업 */
export function GlobalSearchBar({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex-1 max-w-md hidden md:block', className)}>
      <i
        className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
        style={{ color: 'var(--app-ink-4)' }}
      />
      <input
        type="search"
        disabled
        placeholder="학생, 학부모, 반, 수업, 상담, 수강료 검색…"
        aria-label="전역 검색 (준비 중)"
        title="전역 검색은 준비 중입니다"
        className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none cursor-not-allowed opacity-80"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          color: 'var(--app-ink-3)',
        }}
      />
    </div>
  );
}
