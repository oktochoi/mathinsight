'use client';

import { StudentRiskBadge } from '@/components/student/StudentRiskBadge';
import type { RiskDisplayKind } from '@/lib/studentRisk';

export function ConsultationBriefingCard({
  headline,
  lines,
  kindLabel,
  kind,
}: {
  headline: string;
  lines: string[];
  kindLabel: string;
  kind: RiskDisplayKind;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 p-4 shadow-sm" style={{ background: 'var(--app-surface)' }}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>30초 상담 브리핑</p>
        <StudentRiskBadge kindLabel={kindLabel} kind={kind} compact />
        <span className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>기록 기반</span>
      </div>
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>{headline}</p>
      <ul className="list-disc pl-5 text-sm space-y-1 leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
