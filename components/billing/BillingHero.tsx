'use client';

import { formatWon, type BillingKpis } from '@/lib/billingOperations';
import { cn } from '@/lib/cn';

export function BillingHero({
  kpis,
  onRegisterCharge,
  onManageOverdue,
  onExport,
}: {
  kpis: BillingKpis;
  onRegisterCharge: () => void;
  onManageOverdue: () => void;
  onExport?: () => void;
}) {
  const deltaLabel =
    kpis.collectedMonthDeltaPct > 0
      ? `+${kpis.collectedMonthDeltaPct}%`
      : kpis.collectedMonthDeltaPct < 0
        ? `${kpis.collectedMonthDeltaPct}%`
        : '0%';

  return (
    <header
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <p className="app-label">수납 운영 센터</p>
            <h1
              className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight"
              style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
            >
              이번 달 수납 현황
            </h1>
            <p className="text-sm mt-2 max-w-lg" style={{ color: 'var(--app-ink-3)' }}>
              학원의 현금 흐름과 오늘 처리할 수납 업무를 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {onExport && (
              <button type="button" onClick={onExport} className="app-btn app-btn-ghost text-sm">
                <i className="ri-file-excel-2-line" />
                엑셀
              </button>
            )}
            <button type="button" onClick={onManageOverdue} className="app-btn app-btn-secondary text-sm">
              <i className="ri-alert-line" />
              미납 관리
            </button>
            <button type="button" onClick={onRegisterCharge} className="app-btn app-btn-primary text-sm">
              <i className="ri-add-line" />
              청구 등록
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <HeroMetric
            label="이번 달 수납"
            value={formatWon(kpis.collectedThisMonth)}
            sub="완납 기준"
          />
          <HeroMetric
            label="이번 달 미수금"
            value={formatWon(kpis.outstanding)}
            sub={`학생 ${kpis.outstandingStudentCount}명`}
            accent="warning"
          />
          <HeroMetric
            label="전월 대비"
            value={deltaLabel}
            sub={formatWon(kpis.collectedPrevMonth) + ' 수납'}
            accent={kpis.collectedMonthDeltaPct >= 0 ? 'success' : 'danger'}
          />
          <HeroMetric
            label="오늘 입금"
            value={formatWon(kpis.todayCollected)}
            sub={`${kpis.todayCollectedCount}건`}
            accent="info"
          />
        </div>
      </div>
    </header>
  );
}

function HeroMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'success' | 'warning' | 'danger' | 'info';
}) {
  const valueColor =
    accent === 'success'
      ? '#059669'
      : accent === 'warning'
        ? '#d97706'
        : accent === 'danger'
          ? '#dc2626'
          : accent === 'info'
            ? '#2563eb'
            : 'var(--app-ink)';

  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
        {label}
      </p>
      <p
        className={cn('text-xl sm:text-2xl font-bold tabular-nums mt-1 tracking-tight')}
        style={{ color: valueColor, letterSpacing: '-0.04em' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
