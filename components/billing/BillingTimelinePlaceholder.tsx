'use client';

export function BillingTimelinePlaceholder() {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          Payment Timeline
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
          이번 달 청구·수납·미수금 흐름
        </p>
      </div>
      <div
        className="app-chart-placeholder min-h-[12rem] rounded-2xl text-sm"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        [ Chart Placeholder — Monthly Collection Trend ]
      </div>
    </section>
  );
}
