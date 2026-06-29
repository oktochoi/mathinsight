'use client';

import Link from 'next/link';
import type { TimelineEntry } from '@/lib/studentTimeline';

const TYPE_LABELS: Record<string, string> = {
  consultation_card: '상담 카드',
  parent_report: '학부모 리포트',
  lesson_memo: '수업 메모',
  score: '점수',
  homework_missing: '숙제',
  followup: '상담 후 확인',
};

export function StudentTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm py-4" style={{ color: 'var(--app-ink-4)' }}>타임라인 기록이 없습니다.</p>;
  }

  return (
    <ul className="space-y-4">
      {entries.map((e) => {
        const body = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--app-ink-4)' }}>{e.date}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
              >
                {TYPE_LABELS[e.type] ?? e.type}
              </span>
            </div>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--app-ink)' }}>{e.title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>{e.detail}</p>
          </>
        );

        return (
          <li key={e.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <div className="min-w-0 flex-1">
              {e.href ? (
                <Link
                  href={e.href}
                  className="block rounded-lg -m-1 p-1 hover:bg-[var(--app-surface-2)] transition-colors group"
                >
                  {body}
                  <span className="text-[10px] mt-1 inline-block group-hover:underline" style={{ color: 'var(--app-accent)' }}>
                    자세히 보기 →
                  </span>
                </Link>
              ) : (
                body
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
