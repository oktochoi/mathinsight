'use client';

import { formatWon, type BillingKpis } from '@/lib/billingOperations';

export function BillingOverview({ kpis }: { kpis: BillingKpis }) {
  const items = [
    {
      label: '이번 달 수납',
      value: formatWon(kpis.collectedThisMonth),
      delta:
        kpis.collectedMonthDeltaPct !== 0
          ? `${kpis.collectedMonthDeltaPct > 0 ? '+' : ''}${kpis.collectedMonthDeltaPct}% 전월`
          : undefined,
      tone: 'default' as const,
    },
    {
      label: '미수금',
      value: formatWon(kpis.outstanding),
      delta: `학생 ${kpis.outstandingStudentCount}명`,
      tone: 'warning' as const,
    },
    {
      label: '오늘 입금',
      value: formatWon(kpis.todayCollected),
      delta: `${kpis.todayCollectedCount}건`,
      tone: 'info' as const,
    },
    {
      label: '연체 학생',
      value: `${kpis.overdueStudentCount}명`,
      delta: kpis.aiRiskCount > 0 ? `7일+ ${kpis.aiRiskCount}건` : undefined,
      tone: 'danger' as const,
    },
    {
      label: '납부 예정',
      value: formatWon(kpis.dueNext7Days),
      delta: `7일 내 ${kpis.dueNext7DaysCount}건`,
      tone: 'default' as const,
    },
  ];

  return (
    <section>
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>
        Billing Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl px-4 py-4"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
              {item.label}
            </p>
            <p
              className="text-lg sm:text-xl font-bold tabular-nums mt-1.5"
              style={{
                color:
                  item.tone === 'warning'
                    ? 'var(--app-warning)'
                    : item.tone === 'danger'
                      ? 'var(--app-danger)'
                      : item.tone === 'info'
                        ? 'var(--app-accent)'
                        : 'var(--app-ink)',
                letterSpacing: '-0.03em',
              }}
            >
              {item.value}
            </p>
            {item.delta && (
              <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--app-ink-3)' }}>
                {item.delta}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
