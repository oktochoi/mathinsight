'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/cn';
import type { StudentGrowthMetrics } from '@/lib/studentGrowth';

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid var(--app-border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  fontSize: 12,
};

function DeltaBadge({ delta, pct }: { delta: number; pct: number }) {
  const up = delta >= 0;
  return (
    <span
      className={cn('text-xs font-medium tabular-nums', up && 'app-text-success')}
      style={up ? undefined : { color: 'var(--app-ink-3)' }}
    >
      전월 대비 {up ? '+' : ''}
      {delta}명 ({up ? '+' : ''}
      {pct}%)
    </span>
  );
}

function ChangeRow({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: string;
  label: string;
  value: number;
  tone?: 'default' | 'muted' | 'warn';
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: 'var(--app-ink-2)' }}>
        <i className={cn(icon, 'text-sm shrink-0')} style={{ color: 'var(--app-ink-4)' }} />
        <span className="truncate">{label}</span>
      </span>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums shrink-0',
          tone === 'warn' && 'app-card-warning-body'
        )}
        style={{
          color: tone === 'muted' ? 'var(--app-ink-3)' : tone === 'warn' ? undefined : 'var(--app-ink)',
        }}
      >
        {value}명
      </span>
    </div>
  );
}

function AttentionLink({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  if (count === 0) return null;
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 -mx-1 transition-colors hover:bg-[var(--app-surface-2)]"
    >
      <span className="text-sm" style={{ color: 'var(--app-ink-2)' }}>{label}</span>
      <span className="flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: 'var(--app-ink)' }}>
        {count}명
        <i className="ri-arrow-right-s-line" style={{ color: 'var(--app-ink-4)' }} />
      </span>
    </Link>
  );
}

export function StudentGrowthChart({
  data,
  height = 120,
  showGrid = false,
}: {
  data: StudentGrowthMetrics['trend6'];
  height?: number;
  showGrid?: boolean;
}) {
  if (data.every((d) => d.total === 0)) {
    return (
      <div
        className="flex items-center justify-center text-xs"
        style={{ height, color: 'var(--app-ink-4)' }}
      >
        등록·퇴원 기록이 쌓이면 추이가 표시됩니다.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--app-ink-4)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="total"
            name="총 학생"
            stroke="var(--app-ink)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="newRegistrations"
            name="신규"
            stroke="var(--app-success)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="withdrawals"
            name="퇴원"
            stroke="var(--app-orange)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="2 2"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StudentGrowthCard({
  metrics,
  compact = false,
  chartPlaceholder = false,
}: {
  metrics: StudentGrowthMetrics;
  compact?: boolean;
  chartPlaceholder?: boolean;
}) {
  const [range, setRange] = useState<6 | 12>(6);
  const trend = range === 6 ? metrics.trend6 : metrics.trend12;
  const hasAttention =
    metrics.attention.reregistrationPending > 0 ||
    metrics.attention.longAbsence > 0 ||
    metrics.attention.counselingIncomplete > 0;

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        compact ? 'p-5' : 'p-6 lg:p-7'
      )}
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--app-ink-4)' }}>
            Student Growth
          </p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>학생 성장</h3>
        </div>
        <Link
          href="/analytics"
          className="text-xs font-medium flex items-center gap-0.5 transition-colors hover:opacity-70"
          style={{ color: 'var(--app-accent)' }}
        >
          상세
          <i className="ri-arrow-right-s-line" />
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--app-ink)' }}>
          {metrics.currentCount}
          <span className="text-lg font-semibold ml-1.5" style={{ color: 'var(--app-ink-4)' }}>명</span>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>현재 재원 학생</p>
        <div className="mt-2">
          <DeltaBadge delta={metrics.monthDelta} pct={metrics.monthDeltaPct} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="space-y-0.5 pt-4" style={{ borderTop: '1px solid var(--app-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--app-ink-4)' }}>
            이번 달 변화
          </p>
          <ChangeRow icon="ri-user-add-line" label="신규 등록" value={metrics.monthlyChanges.newRegistrations} />
          <ChangeRow icon="ri-refresh-line" label="재등록" value={metrics.monthlyChanges.reregistrations} />
          <ChangeRow
            icon="ri-pause-circle-line"
            label="휴원"
            value={metrics.monthlyChanges.onLeave}
            tone="muted"
          />
          <ChangeRow
            icon="ri-user-unfollow-line"
            label="퇴원"
            value={metrics.monthlyChanges.withdrawals}
            tone={metrics.monthlyChanges.withdrawals > 0 ? 'warn' : 'default'}
          />
        </div>

        {hasAttention && (
          <div className="pt-4" style={{ borderTop: '1px solid var(--app-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--app-ink-4)' }}>
              이번 주 확인
            </p>
            <div className="divide-y divide-[var(--app-border)]">
              <AttentionLink
                label="재등록 예정"
                count={metrics.attention.reregistrationPending}
                href="/analytics?section=reregistration"
              />
              <AttentionLink
                label="장기 결석"
                count={metrics.attention.longAbsence}
                href="/analytics?section=churn"
              />
              <AttentionLink
                label="상담 미완료"
                count={metrics.attention.counselingIncomplete}
                href="/analytics?section=reregistration"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl px-4 py-3 mb-6" style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--app-accent)' }}>
          AI Growth Insight
        </p>
        <ul className="space-y-1.5">
          {metrics.insights.map((line, i) => (
            <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--app-ink-2)' }}>
              <span className="shrink-0" style={{ color: 'var(--app-accent)' }}>·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
            학생 수 추이
          </p>
          {!chartPlaceholder && (
            <div
              className="flex rounded-lg p-0.5"
              style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}
            >
              {([6, 12] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRange(m)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors"
                  style={
                    range === m
                      ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)' }
                      : { color: 'var(--app-ink-3)' }
                  }
                >
                  {m}개월
                </button>
              ))}
            </div>
          )}
        </div>
        {chartPlaceholder ? (
          <div
            className="rounded-xl px-4 py-10 text-center text-xs font-medium"
            style={{
              background: 'var(--app-surface-2)',
              border: '1px dashed var(--app-border)',
              color: 'var(--app-ink-4)',
            }}
          >
            [ Chart Placeholder — Student Growth Trend ]
          </div>
        ) : (
          <StudentGrowthChart data={trend} height={compact ? 100 : 120} />
        )}
      </div>
    </div>
  );
}
