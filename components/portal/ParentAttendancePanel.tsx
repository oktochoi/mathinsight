'use client';

import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { cn } from '@/lib/cn';
import type { PortalAttendanceSummary } from '@/hooks/usePortalErp';

export function ParentAttendancePanel({ summary }: { summary: PortalAttendanceSummary | null }) {
  if (!summary) {
    return <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">출결 기록이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '출석', value: summary.present, tone: 'text-emerald-700 bg-emerald-50' },
          { label: '지각', value: summary.late, tone: 'text-amber-700 bg-amber-50' },
          { label: '결석', value: summary.absent, tone: 'text-red-700 bg-red-50' },
        ].map((c) => (
          <div key={c.label} className={cn('rounded-xl p-3 text-center border border-stone-100', c.tone)}>
            <p className="text-[10px] font-medium opacity-80">{c.label}</p>
            <p className="text-xl font-bold tabular-nums mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {summary.recent.map((r) => (
          <li
            key={r.date}
            className="flex items-center justify-between text-sm parent-card-soft px-3 py-2"
          >
            <span className="text-stone-600 tabular-nums">{r.date}</span>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                r.status === 'absent'
                  ? 'bg-red-50 text-red-700'
                  : r.status === 'late'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
              )}
            >
              {r.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
