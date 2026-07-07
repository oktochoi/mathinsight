'use client';

import type { LessonLog } from '@/types/database';
import type { HomeworkTrend, ScoreTrend } from '@/lib/analytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function attendanceChartData(logs: LessonLog[]) {
  return [...logs]
    .sort((a, b) => a.lesson_date.localeCompare(b.lesson_date))
    .slice(-8)
    .map((l) => ({
      date: l.lesson_date.slice(5).replace('-', '.'),
      ok:
        l.attendance_status === 'present' || l.attendance_status === 'late' ? 100 : 0,
    }));
}

function MiniTrendCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>
        {title}
      </h3>
      {empty ? (
        <p className="text-xs py-8 text-center" style={{ color: 'var(--app-ink-3)' }}>
          기록이 없습니다.
        </p>
      ) : (
        <div className="w-full min-w-0" style={{ height: 140 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function StudentLearningTrend({
  logs,
  scoreTrend,
  hwTrend,
}: {
  logs: LessonLog[];
  scoreTrend: ScoreTrend;
  hwTrend: HomeworkTrend;
}) {
  const attendanceData = attendanceChartData(logs);
  const scoreData = scoreTrend.points;
  const hwData = hwTrend.weeklyRates;

  return (
    <section>
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>
        학습 추세
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniTrendCard title="출결" empty={attendanceData.length === 0}>
          <ResponsiveContainer width="100%" height={140} minWidth={0}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip formatter={(v) => [v === 100 ? '출석' : '결석', '출결']} />
              <Bar dataKey="ok" fill="var(--app-info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MiniTrendCard>

        <MiniTrendCard title="점수" empty={scoreData.length === 0}>
          <ResponsiveContainer width="100%" height={140} minWidth={0}>
            <AreaChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip formatter={(v) => [`${v ?? '—'}점`, '점수']} />
              <Area type="monotone" dataKey="score" stroke="var(--app-info)" fill="var(--app-info)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </MiniTrendCard>

        <MiniTrendCard title="숙제 제출" empty={hwData.every((w) => w.rate === 0)}>
          <ResponsiveContainer width="100%" height={140} minWidth={0}>
            <BarChart data={hwData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip formatter={(v) => [`${v ?? 0}%`, '제출률']} />
              <Bar dataKey="rate" fill="var(--app-success-text)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MiniTrendCard>
      </div>
    </section>
  );
}
