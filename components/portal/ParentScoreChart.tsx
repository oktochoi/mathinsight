'use client';

import type { ScoreTrend } from '@/lib/analytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const TREND_HINT: Record<string, string> = {
  up: '최근 점수가 올라가는 흐름이에요',
  down: '최근 점수가 내려가는 편이에요. 학원 상담을 권해 드려요',
  stable: '최근 점수는 비슷하게 유지되고 있어요',
  insufficient: '기록이 더 쌓이면 추이를 보여 드립니다',
};

export function ParentScoreChart({ trend }: { trend: ScoreTrend }) {
  if (trend.points.length === 0) {
    return (
      <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">
        아직 점수 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="parent-card-soft p-4">
      <p className="text-sm text-stone-600 mb-4">{TREND_HINT[trend.direction] ?? ''}</p>
      <div className="h-[220px] lg:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend.points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e7e5e4',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            formatter={(v) => [`${v ?? '—'}점`, '점수']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
