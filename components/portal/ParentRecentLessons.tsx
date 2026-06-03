'use client';

import type { LessonLog } from '@/types/database';
import { buildRecentLessonSummaries } from '@/lib/learningFlow';
import { cn } from '@/lib/cn';

function homeworkTone(status: string): string {
  if (status.includes('미제출')) return 'text-amber-700 bg-amber-50 border-amber-100';
  if (status.includes('부분')) return 'text-stone-700 bg-stone-100 border-stone-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-100';
}

export function ParentRecentLessons({ logs }: { logs: LessonLog[] }) {
  const items = buildRecentLessonSummaries(logs, 5);

  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center parent-card-soft">
        아직 등록된 수업 기록이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, i) => (
        <li
          key={`${item.date}-${item.unit}-${i}`}
          className={cn(
            'relative pl-6 pb-5 last:pb-0',
            i < items.length - 1 && 'border-l-2 border-indigo-100 ml-2'
          )}
        >
          <span
            className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50 -translate-x-[7px]"
            aria-hidden
          />
          <div className="parent-card-soft p-4 ml-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-stone-900 text-sm">{item.unit}</p>
              <time className="text-xs text-stone-500 tabular-nums">{item.date}</time>
            </div>
            <span
              className={cn(
                'inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-md border',
                homeworkTone(item.homework)
              )}
            >
              숙제 {item.homework}
            </span>
            {item.memo && (
              <p className="text-sm text-stone-600 mt-2 leading-relaxed line-clamp-3">{item.memo}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
