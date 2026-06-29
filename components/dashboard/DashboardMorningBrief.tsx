'use client';

import type { DashboardStats } from '@/types/database';

export function DashboardMorningBrief({
  lines,
  stats,
}: {
  lines: string[];
  stats: Pick<
    DashboardStats,
    | 'absentTodayCount'
    | 'lateTodayCount'
    | 'missingHomeworkCount'
    | 'pendingConsultationCount'
    | 'attentionStudents'
  >;
}) {
  return (
    <section className="rounded-2xl border border-indigo-200/80 overflow-hidden shadow-sm" style={{ background: 'var(--app-surface)' }}>
      <div className="px-5 py-4 border-b border-indigo-100/80 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <i className="ri-sun-line text-white text-lg" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
            AI Morning Brief
          </p>
          <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>오늘 업무 브리핑</h2>
        </div>
      </div>
      <div className="px-5 py-4 space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
            {line}
          </p>
        ))}
      </div>
      <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: '결석', value: stats.absentTodayCount, href: '/attendance', tone: 'text-red-600' },
          { label: '지각', value: stats.lateTodayCount, href: '/attendance', tone: 'text-amber-600' },
          {
            label: '숙제 미제출',
            value: stats.missingHomeworkCount,
            href: '/homework?filter=missing',
            tone: 'text-violet-600',
          },
          {
            label: '조치 학생',
            value: stats.attentionStudents.length,
            href: '/students',
            tone: 'text-indigo-600',
          },
        ].map((chip) => (
          <a
            key={chip.label}
            href={chip.href}
            className="rounded-xl px-3 py-2.5 hover:border-indigo-200 transition-colors"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
          >
            <p className="text-[10px] font-medium" style={{ color: 'var(--app-ink-3)' }}>{chip.label}</p>
            <p className={`text-xl font-bold tabular-nums ${chip.tone}`}>{chip.value}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
