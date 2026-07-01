'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { DashboardStats } from '@/types/database';

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function greetingText(name?: string) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고하셨어요';
  return name ? `${greeting}, ${name}님` : greeting;
}

function formatDelta(
  delta: number | undefined,
  variant: 'default' | 'todayInflow' = 'default'
): string | null {
  if (delta == null) return null;
  if (variant === 'todayInflow') {
    return delta === 0 ? '오늘 신규 없음' : `오늘 +${delta}건`;
  }
  if (delta === 0) return '어제와 동일';
  const arrow = delta > 0 ? '↑' : '↓';
  return `어제 대비 ${arrow}${Math.abs(delta)}`;
}

function MetricCell({
  label,
  value,
  unit,
  tone,
  href,
  delta,
  deltaVariant = 'default',
}: {
  label: string;
  value: number;
  unit: string;
  tone?: 'default' | 'warn' | 'danger';
  href?: string;
  delta?: number;
  deltaVariant?: 'default' | 'todayInflow';
}) {
  const color =
    tone === 'danger' ? 'var(--app-danger)' : tone === 'warn' ? 'var(--app-warning)' : 'var(--app-ink)';
  const deltaText = formatDelta(delta, deltaVariant);
  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-0.5" style={{ color, letterSpacing: '-0.03em' }}>
        {value}
        <span className="text-sm font-semibold ml-0.5" style={{ color: 'var(--app-ink-4)' }}>
          {unit}
        </span>
      </p>
      {deltaText && (
        <p className="text-[10px] mt-1 tabular-nums" style={{ color: 'var(--app-ink-4)' }}>
          {deltaText}
        </p>
      )}
    </>
  );

  if (!href) {
    return <div className="min-w-0">{inner}</div>;
  }

  return (
    <Link
      href={href}
      className="min-w-0 block rounded-xl p-2 -m-2 transition-colors hover:bg-[var(--app-surface-2)]"
    >
      {inner}
    </Link>
  );
}

export function TodayCommandCenter({
  stats,
  onRefresh,
}: {
  stats: DashboardStats;
  onRefresh: () => void;
}) {
  const { profile } = useAuth();
  const inProgress = stats.unclosedLessonsToday.filter((l) => l.status === 'in_progress').length;
  const unclosed = stats.unclosedLessonsToday.length;
  const counselingToday = stats.todayCounselingQueue.length;
  const deltas = stats.kpiDayDeltas;

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--app-ink-4)' }}
              suppressHydrationWarning
            >
              Today Command Center
            </p>
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }} suppressHydrationWarning>
              {todayLabel()}
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mt-2"
              style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
              suppressHydrationWarning
            >
              {greetingText(profile?.name)}
            </h1>
            {stats.morningBriefLines[0] && (
              <div
                className="flex items-start gap-2.5 mt-3 p-3 rounded-xl"
                style={{
                  background: 'var(--app-accent-bg)',
                  border: '1px solid var(--app-accent-border)',
                }}
              >
                <i
                  className="ri-sparkling-line text-sm shrink-0 mt-0.5"
                  style={{ color: 'var(--app-accent)' }}
                />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--app-accent-ink)' }}>
                  {stats.morningBriefLines[0]}
                </p>
              </div>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
              {stats.dashboardMode === 'teacher' ? '담당 반 오늘 운영' : '오늘 학원 운영 현황'}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 self-end lg:self-start transition-colors"
            style={{
              background: 'var(--app-surface-2)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-ink-3)',
            }}
            aria-label="새로고침"
          >
            <i className="ri-refresh-line text-sm" />
          </button>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mt-8 pt-8 border-t"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <MetricCell label="오늘 수업" value={stats.todayLessonCount} unit="개" href="#today-lessons" delta={deltas?.todayLessonCount} />
          <MetricCell
            label="진행 중"
            value={inProgress}
            unit="개"
            tone={inProgress > 0 ? 'warn' : 'default'}
            href="#today-lessons"
            delta={deltas?.inProgress}
          />
          <MetricCell
            label="마감 필요"
            value={unclosed}
            unit="개"
            tone={unclosed > 0 ? 'warn' : 'default'}
            href="/lesson-logs"
            delta={deltas?.unclosed}
          />
          <MetricCell label="상담 예정" value={counselingToday} unit="건" href="/counseling" delta={deltas?.counselingToday} />
          <MetricCell
            label="미납·연체"
            value={stats.overduePaymentsCount}
            unit="건"
            tone={stats.overduePaymentsCount > 0 ? 'danger' : 'default'}
            href="/billing?filter=overdue"
            delta={deltas?.overduePayments}
          />
          <MetricCell
            label="학부모 문의"
            value={stats.pendingParentMessagesCount}
            unit="건"
            tone={stats.pendingParentMessagesCount > 0 ? 'danger' : 'default'}
            href="/messages"
            delta={deltas?.pendingParentMessages}
            deltaVariant="todayInflow"
          />
        </div>
      </div>
    </section>
  );
}
