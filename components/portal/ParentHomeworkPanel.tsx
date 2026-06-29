'use client';

import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { cn } from '@/lib/cn';
import type { HomeworkAssignment, HomeworkSubmission } from '@/types/database';

export function ParentHomeworkPanel({
  assignments,
  recentHw,
}: {
  assignments: (HomeworkAssignment & { submission?: HomeworkSubmission })[];
  recentHw: { date: string; label: string; unit: string; status: string }[];
}) {
  return (
    <div className="space-y-5">
      {assignments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-2">등록된 숙제</p>
          <ul className="space-y-2">
            {assignments.map((a) => {
              const st = a.submission?.status ?? 'missing';
              return (
                <li key={a.id} className="parent-card-soft p-3">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-stone-900 text-sm">{a.title}</p>
                    <span
                      className={cn(
                        'text-xs font-semibold shrink-0',
                        st === 'missing' ? 'text-red-600' : st === 'partial' ? 'text-amber-600' : 'text-emerald-600'
                      )}
                    >
                      {HOMEWORK_LABELS[st]}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">마감 {a.due_date}</p>
                  {a.submission?.feedback_memo && (
                    <p className="text-xs text-stone-600 mt-2">{a.submission.feedback_memo}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-stone-500 mb-2">최근 수업별 숙제</p>
        {recentHw.length === 0 ? (
          <p className="text-sm text-stone-500">기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {recentHw.map((r) => (
              <li key={r.date + r.unit} className="flex justify-between text-sm parent-card-soft px-3 py-2">
                <span className="text-stone-700 truncate mr-2">{r.unit}</span>
                <span className="text-stone-500 text-xs shrink-0">{r.date}</span>
                <span
                  className={cn(
                    'text-xs font-medium ml-2 shrink-0',
                    r.status === 'missing' ? 'text-red-600' : 'text-stone-600'
                  )}
                >
                  {r.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
