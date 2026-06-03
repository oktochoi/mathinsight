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
    <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-sm font-bold text-indigo-950">30초 상담 브리핑</p>
        <StudentRiskBadge kindLabel={kindLabel} kind={kind} compact />
        <span className="text-[10px] text-slate-400">기록 기반</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 mb-2">{headline}</p>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1 leading-relaxed">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
