'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DashboardStats } from '@/types/database';

const CHART_COLORS = {
  blue: 'var(--chart-blue)',
  blueLight: 'var(--chart-blue-light)',
  green: 'var(--chart-green)',
  orange: 'var(--chart-orange)',
  slate: 'var(--chart-slate)',
};

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--app-border)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  fontSize: 12,
};

/** Recharts ResponsiveContainer — grid/flex에서 width -1 방지 */
function ChartBox({
  height,
  children,
  className = '',
}: {
  height: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full min-w-0 ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function MiniSparkline({
  data,
  dataKey = 'rate',
  color = CHART_COLORS.blue,
  height = 48,
}: {
  data: { name: string; rate?: number; count?: number }[];
  dataKey?: 'rate' | 'count';
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  return (
    <ChartBox height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartBox>
  );
}

export function WeeklyOperationsChart({ stats }: { stats: DashboardStats }) {
  const data = stats.weeklyAttendanceTrend.map((a, i) => ({
    name: a.name,
    출결률: a.rate ?? 0,
    숙제제출률: stats.homeworkTrend[i]?.rate ?? 0,
  }));

  if (data.every((d) => d.출결률 === 0 && d.숙제제출률 === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--app-ink-4)' }}>
        운영 기록이 쌓이면 출결·숙제 추이가 표시됩니다.
      </div>
    );
  }

  return (
    <ChartBox height={200}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--app-ink-3)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'var(--app-ink-3)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="출결률" fill={CHART_COLORS.green} fillOpacity={0.85} radius={[4, 4, 0, 0]} barSize={22} />
        <Line
          type="monotone"
          dataKey="숙제제출률"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.blue }}
        />
      </ComposedChart>
    </ChartBox>
  );
}

export function WeeklyCounselingChart({ stats }: { stats: DashboardStats }) {
  const data = stats.weeklyCounselingTrend;

  if (data.every((d) => (d.count ?? 0) === 0)) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs" style={{ color: 'var(--app-ink-4)' }}>
        상담 기록이 쌓이면 추이가 표시됩니다.
      </div>
    );
  }

  return (
    <ChartBox height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}건`, '상담']} />
        <Bar dataKey="count" fill={CHART_COLORS.blueLight} radius={[4, 4, 0, 0]} barSize={20} />
      </BarChart>
    </ChartBox>
  );
}

export function StudentCountChart({
  data,
  total,
}: {
  data: { name: string; count?: number }[];
  total: number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs mb-2" style={{ color: 'var(--app-ink-3)' }}>
        등록 학생 <span className="font-bold" style={{ color: 'var(--app-ink)' }}>{total}명</span>
      </p>
      {data.every((d) => (d.count ?? 0) === 0) ? (
        <div className="h-[140px] flex items-center justify-center text-xs" style={{ color: 'var(--app-ink-4)' }}>
          수업 기록 기준 주간 재원생 추이
        </div>
      ) : (
        <ChartBox height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}명`, '수업 참여']} />
            <Area type="monotone" dataKey="count" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.12} strokeWidth={2} />
          </AreaChart>
        </ChartBox>
      )}
    </div>
  );
}

export function RetentionStatusChart({ high, medium }: { high: number; medium: number }) {
  const data = [
    { name: '상담 우선', value: high, color: 'var(--chart-red)' },
    { name: '상담 권장', value: medium, color: CHART_COLORS.orange },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-xs py-6 text-center" style={{ color: 'var(--app-ink-4)' }}>확인할 학생 없음</p>;
  }

  return (
    <div className="flex items-center gap-4 min-w-0">
      <PieChart width={90} height={90} className="shrink-0">
        <Pie data={data} cx={45} cy={45} innerRadius={28} outerRadius={40} dataKey="value" strokeWidth={0}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
      <ul className="space-y-1 text-xs min-w-0" style={{ color: 'var(--app-ink-2)' }}>
        <li>상담 우선 <span className="font-bold app-text-danger">{high}명</span></li>
        <li>상담 권장 <span className="font-bold" style={{ color: 'var(--chart-orange)' }}>{medium}명</span></li>
      </ul>
    </div>
  );
}

export function HomeworkTrendChart({
  data,
}: {
  data: { name: string; rate: number }[];
}) {
  if (data.every((d) => d.rate === 0)) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs" style={{ color: 'var(--app-ink-4)' }}>
        숙제 기록이 쌓이면 추이가 표시됩니다.
      </div>
    );
  }

  return (
    <ChartBox height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, '제출률']} />
        <Bar dataKey="rate" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} barSize={24} />
      </BarChart>
    </ChartBox>
  );
}

export function ConsultationDonut({ rate }: { rate: number }) {
  const data = [
    { name: '완료', value: rate },
    { name: '미완료', value: Math.max(0, 100 - rate) },
  ];
  const COLORS = [CHART_COLORS.green, 'var(--app-border)'];

  return (
    <div className="flex items-center gap-4 min-w-0">
      <PieChart width={100} height={100} className="shrink-0">
        <Pie
          data={data}
          cx={50}
          cy={50}
          innerRadius={32}
          outerRadius={46}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
      </PieChart>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--app-ink)' }}>{rate}%</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>상담 완료율</p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--app-ink-4)' }}>전체 상담 기준</p>
      </div>
    </div>
  );
}

export function TodayAttendanceDonut({
  present,
  absent,
  late,
}: {
  present: number;
  absent: number;
  late: number;
}) {
  const total = present + absent + late;
  if (total === 0) {
    return (
      <p className="text-xs text-center py-6" style={{ color: 'var(--app-ink-4)' }}>오늘 출결 기록 없음</p>
    );
  }

  const data = [
    { name: '출석', value: present, color: CHART_COLORS.green },
    { name: '지각', value: late, color: CHART_COLORS.orange },
    { name: '결석', value: absent, color: 'var(--chart-red)' },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-3 min-w-0">
      <PieChart width={88} height={88} className="shrink-0">
        <Pie
          data={data}
          cx={44}
          cy={44}
          innerRadius={28}
          outerRadius={40}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
      <ul className="space-y-1 text-xs min-w-0">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2" style={{ color: 'var(--app-ink-2)' }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            {d.name} <span className="font-semibold tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
