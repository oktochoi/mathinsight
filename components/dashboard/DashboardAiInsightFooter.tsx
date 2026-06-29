'use client';

import type { DashboardStats } from '@/types/database';

/** Dashboard 하단 — 짧은 AI 추천 2~3문장 */
export function DashboardAiInsightFooter({ stats }: { stats: DashboardStats }) {
  const lines = stats.morningBriefLines.slice(0, 3);

  if (lines.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl px-5 py-5"
      style={{
        background: 'var(--app-surface-2)',
        border: '1px solid var(--app-border)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--app-ink-4)' }}>
        AI Insight
      </p>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--app-ink-2)' }}>
            <span className="shrink-0 font-medium" style={{ color: 'var(--app-ink-4)' }}>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
