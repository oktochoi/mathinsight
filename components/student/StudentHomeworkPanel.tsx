'use client';

import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { cn } from '@/lib/cn';
import type { HomeworkAssignment, HomeworkSubmission } from '@/types/database';

export function StudentHomeworkPanel({
  assignments,
  recentHw,
}: {
  assignments: (HomeworkAssignment & { submission?: HomeworkSubmission })[];
  recentHw: { date: string; label: string; unit: string; status: string }[];
}) {
  const dueSoon = assignments.filter((a) => {
    const due = new Date(a.due_date);
    const diff = (due.getTime() - Date.now()) / 86400000;
    return diff >= -1 && diff <= 7;
  });

  return (
    <div className="space-y-4">
      {dueSoon.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-sky-800 mb-2">이번 주 숙제</p>
          <ul className="space-y-2">
            {dueSoon.map((a) => {
              const st = a.submission?.status ?? 'missing';
              return (
                <li key={a.id} className="student-card-soft p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--app-ink)' }}>{a.title}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>마감 {a.due_date}</p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-3 py-1 rounded-full',
                        st === 'complete'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {HOMEWORK_LABELS[st]}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>{a.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {recentHw.length > 0 && (
        <ul className="space-y-2">
          {recentHw.slice(0, 5).map((r) => (
            <li
              key={r.date + r.unit}
              className="flex items-center justify-between student-card-soft px-3 py-2 text-sm"
            >
              <span className="font-medium" style={{ color: 'var(--app-ink)' }}>{r.unit}</span>
              <span className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{r.label}</span>
            </li>
          ))}
        </ul>
      )}
      {dueSoon.length === 0 && recentHw.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--app-ink-3)' }}>숙제 정보가 아직 없어요.</p>
      )}
    </div>
  );
}
