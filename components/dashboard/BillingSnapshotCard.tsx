'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';

function SnapshotMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums mt-0.5"
        style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-ink-4)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function BillingSnapshotCard({ stats }: { stats: DashboardStats }) {
  const hasOverdue = stats.overduePaymentsCount > 0;

  return (
    <section
      className="rounded-2xl h-full flex flex-col"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--app-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--app-ink-4)' }}>
          Billing Snapshot
        </p>
        <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          수납 운영 요약
        </h3>
      </div>

      <div className="px-6 py-5 flex-1 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <SnapshotMetric label="연체 건수" value={`${stats.overduePaymentsCount}건`} />
          <SnapshotMetric
            label="미납 확인"
            value={hasOverdue ? '필요' : '없음'}
            sub={hasOverdue ? '연락·수납 처리' : '안정적'}
          />
        </div>

        <div
          className="rounded-xl px-4 py-8 text-center text-xs font-medium"
          style={{
            background: 'var(--app-surface-2)',
            border: '1px dashed var(--app-border)',
            color: 'var(--app-ink-4)',
          }}
        >
          [ Chart Placeholder — Billing Collection Trend ]
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
          이번 달 수납·미수금·오늘 입금 상세는 수납 운영 센터에서 확인하세요.
        </p>

        <Link
          href="/billing"
          className="mt-auto w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors"
          style={
            hasOverdue
              ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)' }
              : { background: 'var(--app-surface-2)', color: 'var(--app-ink)', border: '1px solid var(--app-border)' }
          }
        >
          {hasOverdue ? `미납 ${stats.overduePaymentsCount}건 확인` : '수납 현황 보기'}
        </Link>
      </div>
    </section>
  );
}
