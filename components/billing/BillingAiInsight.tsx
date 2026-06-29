'use client';

/** Billing 하단 — 짧은 AI 운영 인사이트 */
export function BillingAiInsight({ lines }: { lines: string[] }) {
  const display = lines.slice(0, 5);
  if (display.length === 0) return null;

  return (
    <section
      className="rounded-2xl px-6 py-5"
      style={{
        background: 'var(--app-surface-2)',
        border: '1px solid var(--app-border)',
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--app-ink-4)' }}
      >
        AI Billing Insight
      </p>
      <ul className="space-y-2">
        {display.map((line, i) => (
          <li
            key={i}
            className="text-sm leading-relaxed flex gap-2"
            style={{ color: 'var(--app-ink-2)' }}
          >
            <span className="shrink-0" style={{ color: 'var(--app-ink-4)' }}>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
