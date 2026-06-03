'use client';

import type { LessonLog } from '@/types/database';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { cn } from '@/lib/cn';

const hwStyles: Record<string, string> = {
  complete: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  missing: 'bg-rose-50 text-rose-800 border-rose-200',
};

export function StudentLessonHistory({ logs }: { logs: LessonLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-6 text-center">
        아직 수업 기록이 없습니다. 수업이 진행되면 여기에 표시됩니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {logs.map((l) => (
        <li key={l.id} className="px-4 sm:px-5 py-4 hover:bg-slate-50/80 transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{l.lesson_date}</p>
              <p className="text-base text-slate-800 mt-0.5">{l.unit || '수업'}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {l.test_score != null && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {l.test_score}점
                </span>
              )}
              <span
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full border',
                  hwStyles[l.homework_status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                )}
              >
                숙제 {HOMEWORK_LABELS[l.homework_status]}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            출결 {ATTENDANCE_LABELS[l.attendance_status]}
            {(l.tags?.length ?? 0) > 0 && (
              <span className="ml-2">· {l.tags!.join(', ')}</span>
            )}
          </p>
          {l.memo?.trim() && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed rounded-lg bg-sky-50/60 border border-sky-100 px-3 py-2">
              {l.memo.trim()}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
