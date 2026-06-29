'use client';

import {
  WeeklyOperationsChart,
  HomeworkTrendChart,
} from '@/components/dashboard/DashboardCharts';
import { ChartCard } from '@/components/data-ui/ChartCard';
import { weekOverWeekDelta } from '@/lib/dashboardInsights';
import type { DashboardStats } from '@/types/database';

/**
 * Dashboard에는 핵심 2개 차트만 표시.
 * 상담 완료율 · 재원생 추이 · 학년별 점수는 /analytics에서 확인.
 */
export function DashboardOperationsCharts({ stats }: { stats: DashboardStats }) {
  const attendanceEmpty = stats.weeklyAttendanceTrend.every((d) => (d.rate ?? 0) === 0);
  const homeworkEmpty = stats.homeworkTrend.every((d) => d.rate === 0);

  const attendanceRate =
    stats.weeklyAttendanceTrend[stats.weeklyAttendanceTrend.length - 1]?.rate ?? 0;
  const homeworkRate = stats.homeworkTrend[stats.homeworkTrend.length - 1]?.rate ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>이번 주 현황</h2>
        <a href="/analytics" className="text-xs hover:underline" style={{ color: 'var(--app-accent)' }}>
          전체 분석 →
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <ChartCard
          title="출석률"
          description="주간 출결 추이"
          value={attendanceEmpty ? undefined : attendanceRate}
          unit="%"
          delta={weekOverWeekDelta(stats.weeklyAttendanceTrend)}
          empty={attendanceEmpty}
        >
          <WeeklyOperationsChart stats={stats} />
        </ChartCard>

        <ChartCard
          title="숙제 제출률"
          description="최근 5주 추이"
          value={homeworkEmpty ? undefined : homeworkRate}
          unit="%"
          delta={weekOverWeekDelta(stats.homeworkTrend.map((h) => ({ rate: h.rate })))}
          empty={homeworkEmpty}
        >
          <HomeworkTrendChart data={stats.homeworkTrend} />
        </ChartCard>
      </div>
    </div>
  );
}
