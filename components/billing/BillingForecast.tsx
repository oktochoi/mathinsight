'use client';

import { formatWon, type BillingForecast } from '@/lib/billingOperations';

function ForecastStep({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? 'opacity-70' : ''}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-3)' }}>{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: 'var(--app-ink)' }}>{value}</p>
    </div>
  );
}

export function BillingForecast({ forecast }: { forecast: BillingForecast }) {
  return (
    <section className="rounded-2xl p-6 shadow-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="mb-6">
        <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>Revenue Forecast</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>등록·재등록·수납 패턴 기반 예측</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
        <ForecastStep label="현재 수납" value={formatWon(forecast.collectedSoFar)} />
        <div className="hidden sm:block text-2xl pb-2" style={{ color: 'var(--app-border-md)' }}>↓</div>
        <ForecastStep label="이번 달 예상" value={formatWon(forecast.expectedMonthRevenue)} />
        <div className="hidden sm:block text-2xl pb-2" style={{ color: 'var(--app-border-md)' }}>↓</div>
        <ForecastStep
          label="예상 미수금"
          value={formatWon(forecast.expectedOutstanding)}
          muted
        />
        <div className="hidden sm:block text-2xl pb-2" style={{ color: 'var(--app-border-md)' }}>↓</div>
        <ForecastStep label="다음 달 예상" value={formatWon(forecast.nextMonthExpected)} />
      </div>
      <ul className="mt-6 pt-5 space-y-1" style={{ borderTop: '1px solid var(--app-border)' }}>
        {forecast.rationale.map((line, i) => (
          <li key={i} className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
            · {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
