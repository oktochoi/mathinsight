'use client';

function TrendPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl px-4 py-10 text-center text-xs font-medium"
      style={{
        background: 'var(--app-surface-2)',
        border: '1px dashed var(--app-border)',
        color: 'var(--app-ink-4)',
      }}
    >
      [ Chart Placeholder — {label} ]
    </div>
  );
}

export function StudentLearningTrend() {
  return (
    <section>
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>
        Learning Trend
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrendPlaceholder label="Attendance Trend" />
        <TrendPlaceholder label="Score Trend" />
        <TrendPlaceholder label="Homework Completion" />
      </div>
    </section>
  );
}
