'use client';

import type { ConsultationFollowup, LessonLog } from '@/types/database';
import {
  buildStudentFlowSummary,
  buildStudentPeriodChanges,
} from '@/lib/learningFlow';
import { cn } from '@/lib/cn';

export function StudentFlowHeader({
  logs,
  followups = [],
}: {
  logs: LessonLog[];
  followups?: ConsultationFollowup[];
}) {
  const summary = buildStudentFlowSummary(logs, followups);
  const changes = buildStudentPeriodChanges(logs);

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          최근 흐름 (기록 요약)
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-1">{summary}</p>
      </div>
      {changes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            이전 기간 대비
          </p>
          <div className="flex flex-wrap gap-2">
            {changes.map((c) => (
              <span
                key={c.label}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border font-medium',
                  c.direction === 'up' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  c.direction === 'down' && 'bg-amber-50 text-amber-800 border-amber-200',
                  c.direction === 'stable' && 'bg-slate-50 text-slate-600 border-slate-200'
                )}
              >
                {c.label} {c.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
