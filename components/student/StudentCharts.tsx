'use client';

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

export function StudentCharts({
  scoreTrend,
  scoreChart,
  hwChart,
}: {
  scoreTrend: ScoreTrend;
  scoreChart: { date: string; score: number }[];
  hwChart: { week: string; rate: number }[];
}) {
  const hasHw = hwChart.length > 0 && !hwChart.every((w) => w.rate === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      <div className="student-card-soft p-4 lg:p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-ink)' }}>점수 추이</h3>
        {scoreChart.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--app-ink-3)' }}>점수 기록이 없어요.</p>
        ) : (
          <>
            <div className="w-full min-w-0" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <AreaChart data={scoreChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v ?? '—'}점`, '점수']} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--student-accent, var(--app-info))"
                    strokeWidth={2}
                    fill="url(#studentScoreGrad)"
                  />
                  <defs>
                    <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--student-accent, var(--app-info))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--student-accent, var(--app-info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {scoreTrend.direction === 'up' && scoreTrend.delta != null && (
              <p className="text-xs text-emerald-700 mt-2">최근 점수가 올라가는 흐름이에요.</p>
            )}
            {scoreTrend.direction === 'down' && scoreTrend.delta != null && (
              <p className="text-xs text-amber-800 mt-2">최근 점수가 조금 내려갔어요. 복습해 볼까요?</p>
            )}
          </>
        )}
      </div>

      <div className="student-card-soft p-4 lg:p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-ink)' }}>숙제 제출 (주별)</h3>
        {!hasHw ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--app-ink-3)' }}>숙제 기록이 아직 없어요.</p>
        ) : (
          <div className="w-full min-w-0" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <BarChart data={hwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, '제출률']} />
                <Bar dataKey="rate" fill="var(--student-accent, var(--app-info))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
