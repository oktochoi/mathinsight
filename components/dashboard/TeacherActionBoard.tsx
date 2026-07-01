'use client';

import { TodayCommandCenter } from '@/components/dashboard/TodayCommandCenter';
import { TodayTasksPanel } from '@/components/dashboard/TodayTasksPanel';
import { TodayLessonsPanel } from '@/components/dashboard/TodayLessonsPanel';
import { DashboardAttentionStudents } from '@/components/dashboard/DashboardAttentionStudents';
import { DashboardTimelineWidget } from '@/components/dashboard/DashboardWidgets';
import { StaffScopeBanner } from '@/components/staff/StaffScopeBanner';
import type { DashboardStats } from '@/types/database';

/** 강사용 운영 Dashboard */
export function TeacherActionBoard({
  stats,
  onRefresh,
}: {
  stats: DashboardStats;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <StaffScopeBanner />
      <TodayCommandCenter stats={stats} onRefresh={onRefresh} />
      <DashboardAttentionStudents stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6 min-w-0">
          <TodayLessonsPanel stats={stats} />
          <TodayTasksPanel stats={stats} />
        </div>
        <aside className="xl:col-span-5 min-w-0 xl:sticky xl:top-6 xl:self-start">
          <DashboardTimelineWidget stats={stats} />
        </aside>
      </div>
    </div>
  );
}
