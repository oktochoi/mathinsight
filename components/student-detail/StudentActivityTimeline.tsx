'use client';

import Link from 'next/link';
import type { TimelineEntry } from '@/lib/studentTimeline';

const TYPE_LABELS: Record<string, string> = {
  consultation_card: '상담',
  parent_report: '학부모 전달',
  lesson_memo: '수업 메모',
  score: '점수',
  homework_missing: '숙제',
  attendance: '출결',
  counseling_session: '상담',
  followup: '상담 후 확인',
};

export function StudentActivityTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-xl px-4 py-12 text-center text-sm"
        style={{
          background: 'var(--app-surface-2)',
          border: '1px dashed var(--app-border)',
          color: 'var(--app-ink-4)',
        }}
      >
        아직 기록된 활동이 없습니다. 수업·상담 기록이 쌓이면 타임라인에 표시됩니다.
      </div>
    );
  }

  const grouped = entries.reduce<Map<string, TimelineEntry[]>>((map, e) => {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
    return map;
  }, new Map());

  const dates = [...grouped.keys()].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="relative">
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: 'var(--app-border)' }}
      />
      <ul className="space-y-8">
        {dates.map((date) => {
          const dayEntries = grouped.get(date) ?? [];
          return (
            <li key={date}>
              <p
                className="text-xs font-bold tabular-nums mb-3 pl-6"
                style={{ color: 'var(--app-ink-3)' }}
              >
                {date}
              </p>
              <ul className="space-y-4">
                {dayEntries.map((e) => {
                  const body = (
                    <>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
                      >
                        {TYPE_LABELS[e.type] ?? e.type}
                      </span>
                      <p className="text-sm font-medium mt-1.5" style={{ color: 'var(--app-ink)' }}>
                        {e.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
                        {e.detail}
                      </p>
                    </>
                  );
                  return (
                    <li key={e.id} className="flex gap-4 pl-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10"
                        style={{ background: 'var(--app-accent)', border: '2px solid var(--app-surface)' }}
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        {e.href ? (
                          <Link href={e.href} className="block hover:opacity-80 transition-opacity">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
