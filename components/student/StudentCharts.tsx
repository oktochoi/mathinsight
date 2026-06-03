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
        <h3 className="text-sm font-semibold text-slate-800 mb-3">점수 추이</h3>
        {scoreChart.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">점수 기록이 없어요.</p>
        ) : (
          <>
            <div className="h-[220px] lg:h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v ?? '—'}점`, '점수']} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#studentScoreGrad)"
                  />
                  <defs>
                    <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
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
        <h3 className="text-sm font-semibold text-slate-800 mb-3">숙제 제출 (주별)</h3>
        {!hasHw ? (
          <p className="text-sm text-slate-500 py-8 text-center">숙제 기록이 아직 없어요.</p>
        ) : (
          <div className="h-[220px] lg:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, '제출률']} />
                <Bar dataKey="rate" fill="#0369a1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
