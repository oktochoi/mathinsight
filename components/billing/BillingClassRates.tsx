'use client';

import { formatWon } from '@/lib/billingOperations';
import type { ClassCollectionRate } from '@/lib/billingOperations';

export function BillingClassRates({ rates }: { rates: ClassCollectionRate[] }) {
  if (rates.length === 0) return null;

  return (
    <section className="rounded-2xl p-6 shadow-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="mb-5">
        <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>반별 수납 현황</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>이번 달 반별 수납률</p>
      </div>
      <ul className="space-y-4">
        {rates.map((c) => (
          <li key={c.classId}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-sm font-medium truncate" style={{ color: 'var(--app-ink)' }}>{c.className}</span>
              <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--app-ink)' }}>
                {c.rate}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--app-surface-2)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${c.rate}%`, background: 'var(--app-accent)' }}
              />
            </div>
            <p className="text-[11px] tabular-nums mt-1" style={{ color: 'var(--app-ink-4)' }}>
              {formatWon(c.paidAmount)} / {formatWon(c.totalAmount)} · 학생 {c.studentCount}명
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
