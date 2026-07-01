'use client';

import Link from 'next/link';
import type { TimelineEntry, TimelineEntryType } from '@/lib/studentTimeline';

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

const ENTRY_META: Record<
  TimelineEntryType,
  { icon: string; color: string; dotColor: string }
> = {
  consultation_card: { icon: 'ri-discuss-line', color: '#6366f1', dotColor: '#818cf8' },
  parent_report: { icon: 'ri-file-text-line', color: '#0891b2', dotColor: '#22d3ee' },
  lesson_memo: { icon: 'ri-chat-quote-line', color: '#7c3aed', dotColor: '#a78bfa' },
  score: { icon: 'ri-bar-chart-box-line', color: '#2563eb', dotColor: '#60a5fa' },
  homework_missing: { icon: 'ri-alert-line', color: '#dc2626', dotColor: '#f87171' },
  attendance: { icon: 'ri-calendar-close-line', color: '#ea580c', dotColor: '#fb923c' },
  counseling_session: { icon: 'ri-psychotherapy-line', color: '#059669', dotColor: '#34d399' },
  followup: { icon: 'ri-checkbox-circle-line', color: '#0369a1', dotColor: '#38bdf8' },
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

  const scoreEntries = entries.filter((e) => e.type === 'score');

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
                {dayEntries.map((entry) => {
                  const meta = ENTRY_META[entry.type];
                  const scoreIdx =
                    entry.type === 'score'
                      ? scoreEntries.findIndex((e) => e.id === entry.id)
                      : -1;
                  const prevScore =
                    scoreIdx >= 0 && scoreIdx < scoreEntries.length - 1
                      ? parseFloat(scoreEntries[scoreIdx + 1].detail.match(/(\d+)점/)?.[1] ?? '0')
                      : null;
                  const thisScore = parseFloat(entry.detail.match(/(\d+)점/)?.[1] ?? '0');
                  const scoreDelta = prevScore != null ? thisScore - prevScore : null;

                  const content = (
                    <>
                      <div
                        className="absolute left-0 top-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          background: `${meta.color}20`,
                          border: `1.5px solid ${meta.dotColor}`,
                        }}
                      >
                        <i className={`${meta.icon} text-[9px]`} style={{ color: meta.color }} />
                      </div>

                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
                      >
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                      <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--app-ink)' }}>
                        {entry.title}
                        {scoreDelta != null && (
                          <span
                            className={`ml-2 text-xs font-bold ${
                              scoreDelta > 0
                                ? 'text-emerald-600'
                                : scoreDelta < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {scoreDelta > 0
                              ? `↑ +${scoreDelta}점`
                              : scoreDelta < 0
                                ? `↓ ${scoreDelta}점`
                                : '변화 없음'}
                          </span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
                        {entry.detail}
                      </p>
                    </>
                  );

                  return (
                    <li key={entry.id} className="relative pl-8">
                      {entry.href ? (
                        <Link href={entry.href} className="block hover:opacity-80 transition-opacity">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
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
