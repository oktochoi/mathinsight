'use client';

import { TodayCommandCenter } from '@/components/dashboard/TodayCommandCenter';
import { TodayTasksPanel } from '@/components/dashboard/TodayTasksPanel';
import { TodayLessonsPanel } from '@/components/dashboard/TodayLessonsPanel';
import { DashboardAiInsightFooter } from '@/components/dashboard/DashboardAiInsightFooter';
import { DashboardTimelineWidget } from '@/components/dashboard/DashboardWidgets';
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
      <TodayCommandCenter stats={stats} onRefresh={onRefresh} />
      <TodayTasksPanel stats={stats} />
      <TodayLessonsPanel stats={stats} />
      <DashboardAiInsightFooter stats={stats} />
      <DashboardTimelineWidget stats={stats} />
    </div>
  );
}
