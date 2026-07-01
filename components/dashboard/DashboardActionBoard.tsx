'use client';

import Link from 'next/link';
import { TodayCommandCenter } from '@/components/dashboard/TodayCommandCenter';
import { TodayTasksPanel } from '@/components/dashboard/TodayTasksPanel';
import { TodayLessonsPanel } from '@/components/dashboard/TodayLessonsPanel';
import { DashboardAttentionStudents } from '@/components/dashboard/DashboardAttentionStudents';
import { BillingSnapshotCard } from '@/components/dashboard/BillingSnapshotCard';
import { ReregistrationSnapshotCard } from '@/components/dashboard/ReregistrationSnapshotCard';
import { StudentGrowthWidget } from '@/components/dashboard/StudentGrowthWidget';
import {
  DashboardTimelineWidget,
  DashboardNoticesWidget,
  DashboardParentMessagesWidget,
} from '@/components/dashboard/DashboardWidgets';
import { DashboardOperationsCharts } from '@/components/dashboard/DashboardOperationsCharts';
import type { DashboardStats } from '@/types/database';

/** 원장용 운영 센터 Dashboard — 좌(할 일) / 우(현황) 2컬럼 */
export function DashboardActionBoard({
  stats,
  onRefresh,
}: {
  stats: DashboardStats;
  onRefresh: () => void;
}) {
  const pendingMessages = stats.pendingParentMessagesCount;

  return (
    <div className="space-y-6">
      <TodayCommandCenter stats={stats} onRefresh={onRefresh} />
      <DashboardAttentionStudents stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6 min-w-0">
          <TodayLessonsPanel stats={stats} />
          <TodayTasksPanel stats={stats} />
        </div>

        <aside className="xl:col-span-5 space-y-6 min-w-0 xl:sticky xl:top-6 xl:self-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <ReregistrationSnapshotCard stats={stats} />
            <BillingSnapshotCard stats={stats} />
          </div>
          <StudentGrowthWidget />
          {pendingMessages > 0 ? (
            <DashboardParentMessagesWidget stats={stats} />
          ) : (
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-sm"
              style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
            >
              <span style={{ color: 'var(--app-ink-3)' }}>새 학부모 문의가 없습니다.</span>
              <Link href="/messages" className="font-medium shrink-0" style={{ color: 'var(--app-accent)' }}>
                문의함 →
              </Link>
            </div>
          )}
          <DashboardNoticesWidget stats={stats} />
          <DashboardOperationsCharts stats={stats} />
          <DashboardTimelineWidget stats={stats} />
        </aside>
      </div>
    </div>
  );
}
