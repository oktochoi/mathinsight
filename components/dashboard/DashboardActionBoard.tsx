'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TodayCommandCenter } from '@/components/dashboard/TodayCommandCenter';
import { TodayTasksPanel } from '@/components/dashboard/TodayTasksPanel';
import { TodayLessonsPanel } from '@/components/dashboard/TodayLessonsPanel';
import { BillingSnapshotCard } from '@/components/dashboard/BillingSnapshotCard';
import { DashboardAiInsightFooter } from '@/components/dashboard/DashboardAiInsightFooter';
import { StudentGrowthWidget } from '@/components/dashboard/StudentGrowthWidget';
import {
  DashboardTimelineWidget,
  DashboardNoticesWidget,
  DashboardParentMessagesWidget,
} from '@/components/dashboard/DashboardWidgets';
import { DashboardOperationsCharts } from '@/components/dashboard/DashboardOperationsCharts';
import type { DashboardStats } from '@/types/database';
import { cn } from '@/lib/cn';

function DashboardMoreSection({ stats }: { stats: DashboardStats }) {
  const [open, setOpen] = useState(false);
  const pendingMessages = stats.pendingParentMessagesCount;
  const noticeCount = stats.recentNotices.length;
  const subtitleParts: string[] = [];
  if (pendingMessages > 0) subtitleParts.push(`미확인 문의 ${pendingMessages}건`);
  if (noticeCount > 0) subtitleParts.push(`공지 ${noticeCount}건`);
  const subtitle =
    subtitleParts.length > 0
      ? subtitleParts.join(' · ')
      : '공지 · 문의 · 활동 · 운영 차트';

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--app-surface-2)] transition-colors"
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
            {pendingMessages > 0 ? `미확인 문의 ${pendingMessages}건` : '추가 운영 정보'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {subtitle}
          </p>
        </div>
        <i
          className={cn('ri-arrow-down-s-line text-lg transition-transform', open && 'rotate-180')}
          style={{ color: 'var(--app-ink-4)' }}
        />
      </button>
      {open && (
        <div className="px-5 pb-6 pt-2 space-y-4 border-t" style={{ borderColor: 'var(--app-border)' }}>
          {pendingMessages === 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--app-surface-2)' }}>
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>새 문의가 없습니다.</p>
              <Link href="/messages" className="text-sm font-medium shrink-0" style={{ color: 'var(--app-accent)' }}>
                문의함 바로가기 →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DashboardParentMessagesWidget stats={stats} />
            <DashboardNoticesWidget stats={stats} />
          </div>
          <DashboardOperationsCharts stats={stats} />
          <DashboardTimelineWidget stats={stats} />
        </div>
      )}
    </section>
  );
}

/** 원장용 운영 센터 Dashboard */
export function DashboardActionBoard({
  stats,
  onRefresh,
}: {
  stats: DashboardStats;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <TodayCommandCenter stats={stats} onRefresh={onRefresh} />
      <TodayTasksPanel stats={stats} />
      <TodayLessonsPanel stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <StudentGrowthWidget />
        <BillingSnapshotCard stats={stats} />
      </div>

      <DashboardAiInsightFooter stats={stats} />
      <DashboardMoreSection stats={stats} />
    </div>
  );
}
