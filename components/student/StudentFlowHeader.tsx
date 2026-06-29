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
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
          최근 학습 현황
        </p>
        <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--app-ink-2)' }}>{summary}</p>
      </div>
      {changes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--app-ink-4)' }}>
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
                )}
                style={c.direction === 'stable' ? { background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' } : undefined}
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
