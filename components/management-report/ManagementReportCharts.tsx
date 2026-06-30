'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BillingKpis } from '@/lib/billingOperations';
import type { ClassAnalysisRow, CounselingFunnel } from '@/lib/managementReport';
import type { StudentGrowthMetrics } from '@/lib/studentGrowth';

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid var(--app-border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  fontSize: 12,
};

export function GrowthTrendChart({ growth }: { growth: StudentGrowthMetrics }) {
  const data = growth.trend6.map((p) => ({
    label: p.label,
    재원생: p.total,
    신규: p.newRegistrations,
    퇴원: p.withdrawals,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: 'var(--app-ink-3)' }}>추이 데이터 없음</p>;
  }

  return (
    <div className="h-36 sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="재원생" stroke="var(--chart-blue)" fill="var(--avatar-1-bg)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClassStudentChart({ rows }: { rows: ClassAnalysisRow[] }) {
  const data = rows.slice(0, 8).map((c) => ({
    name: c.name.length > 6 ? `${c.name.slice(0, 6)}…` : c.name,
    학생: c.studentCount,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: 'var(--app-ink-3)' }}>반 데이터 없음</p>;
  }

  return (
    <div className="h-36 sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="학생" fill="var(--chart-indigo)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CounselingFunnelChart({ funnel }: { funnel: CounselingFunnel }) {
  const data = [
    { stage: '예약', count: funnel.booked },
    { stage: '완료', count: funnel.completed },
    { stage: '등록', count: funnel.registered },
  ];

  return (
    <div className="h-36 sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="var(--chart-teal)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueCompareChart({ billing }: { billing: BillingKpis }) {
  const data = [
    { month: '지난달', 수납: billing.collectedPrevMonth },
    { month: '이번 달', 수납: billing.collectedThisMonth },
  ];

  return (
    <div className="h-36 sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `${Math.round(Number(v) / 10000)}만`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${Number(v).toLocaleString()}원`, '수납']}
          />
          <Bar dataKey="수납" fill="var(--chart-green)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
