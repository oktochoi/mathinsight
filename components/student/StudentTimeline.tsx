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
    return <p className="text-sm text-slate-400 py-4">타임라인 기록이 없습니다.</p>;
  }

  return (
    <ul className="space-y-4">
      {entries.map((e) => {
        const body = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">{e.date}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {TYPE_LABELS[e.type] ?? e.type}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{e.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{e.detail}</p>
          </>
        );

        return (
          <li key={e.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <div className="min-w-0 flex-1">
              {e.href ? (
                <Link
                  href={e.href}
                  className="block rounded-lg -m-1 p-1 hover:bg-slate-50 transition-colors group"
                >
                  {body}
                  <span className="text-[10px] text-indigo-600 mt-1 inline-block group-hover:underline">
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
