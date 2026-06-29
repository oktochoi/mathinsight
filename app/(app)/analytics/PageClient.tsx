'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { ChartCard } from '@/components/data-ui/ChartCard';
import { weekOverWeekDelta } from '@/lib/dashboardInsights';
import {
  WeeklyOperationsChart,
  HomeworkTrendChart,
  WeeklyCounselingChart,
  StudentCountChart,
  ConsultationDonut,
  TodayAttendanceDonut,
} from '@/components/dashboard/DashboardCharts';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';

function KpiCard({
  label,
  value,
  unit = '',
  delta,
  icon,
  accent,
  empty,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  delta?: number | null;
  icon: string;
  accent?: string;
  empty?: boolean;
}) {
  const hasValue = value != null && !empty;
  const deltaPositive = delta != null && delta > 0;
  const deltaNegative = delta != null && delta < 0;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accent ? `${accent}18` : 'var(--app-surface-2)' }}
        >
          <i className={cn(icon, 'text-sm')} style={{ color: accent ?? 'var(--app-ink-3)' }} />
        </span>
        <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{label}</p>
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}>
          {hasValue ? `${value}${unit}` : '—'}
        </p>
        {delta != null && delta !== 0 && (
          <p className="text-xs mt-1 font-medium" style={{ color: deltaPositive ? '#059669' : deltaNegative ? '#dc2626' : 'var(--app-ink-4)' }}>
            {deltaPositive ? '▲' : '▼'} {Math.abs(delta)}{unit} 전주 대비
          </p>
        )}
        {(delta === 0) && (
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-4)' }}>전주와 동일</p>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPageClient() {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!stats) return null;

  const attendanceEmpty = stats.weeklyAttendanceTrend.every((d) => (d.rate ?? 0) === 0);
  const homeworkEmpty = stats.homeworkTrend.every((d) => d.rate === 0);
  const attendanceRate =
    stats.weeklyAttendanceTrend[stats.weeklyAttendanceTrend.length - 1]?.rate ?? 0;
  const homeworkRate = stats.homeworkTrend[stats.homeworkTrend.length - 1]?.rate ?? 0;

  const attendanceDelta = weekOverWeekDelta(stats.weeklyAttendanceTrend);
  const homeworkDelta = weekOverWeekDelta(stats.homeworkTrend.map((h) => ({ rate: h.rate })));

  return (
    <div className="space-y-8 w-full min-w-0 max-w-5xl mx-auto pb-12">
      <div>
        <PageHeader title={STAFF_PAGES.analytics.title} />
        <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
          {STAFF_PAGES.analytics.description}
        </p>
      </div>

      {/* KPI 요약 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="재원생"
          value={stats.totalStudentCount}
          unit="명"
          icon="ri-group-line"
          accent="#6366f1"
        />
        <KpiCard
          label="이번 주 출석률"
          value={attendanceEmpty ? null : attendanceRate}
          unit="%"
          delta={attendanceEmpty ? null : attendanceDelta}
          icon="ri-checkbox-circle-line"
          accent="#0ea5e9"
          empty={attendanceEmpty}
        />
        <KpiCard
          label="숙제 완료율"
          value={homeworkEmpty ? null : homeworkRate}
          unit="%"
          delta={homeworkEmpty ? null : homeworkDelta}
          icon="ri-book-2-line"
          accent="#10b981"
          empty={homeworkEmpty}
        />
        <KpiCard
          label="상담 완료율"
          value={stats.consultationCompletionRate}
          unit="%"
          icon="ri-chat-check-line"
          accent="#8b5cf6"
        />
      </div>

      {/* 오늘 현황 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-ink)' }}>오늘 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="오늘 출결" description={`출석 ${stats.presentTodayCount} · 결석 ${stats.absentTodayCount} · 지각 ${stats.lateTodayCount}`}>
            <TodayAttendanceDonut
              present={stats.presentTodayCount}
              absent={stats.absentTodayCount}
              late={stats.lateTodayCount}
            />
          </ChartCard>
          <ChartCard title="상담 완료율" description="전체 상담 카드 기준">
            <ConsultationDonut rate={stats.consultationCompletionRate} />
          </ChartCard>
        </div>
      </section>

      {/* 주간 추이 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-ink)' }}>주간 추이</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard
            title="출석률"
            description="주간 출결 추이"
            value={attendanceEmpty ? undefined : attendanceRate}
            unit="%"
            delta={attendanceEmpty ? undefined : attendanceDelta}
            empty={attendanceEmpty}
          >
            <WeeklyOperationsChart stats={stats} />
          </ChartCard>

          <ChartCard
            title="숙제 제출률"
            description="최근 5주 추이"
            value={homeworkEmpty ? undefined : homeworkRate}
            unit="%"
            delta={homeworkEmpty ? undefined : homeworkDelta}
            empty={homeworkEmpty}
          >
            <HomeworkTrendChart data={stats.homeworkTrend} />
          </ChartCard>

          <ChartCard title="상담 건수" description="주간 상담 추이">
            <WeeklyCounselingChart stats={stats} />
          </ChartCard>

          <ChartCard title="재원생 추이" description="수업 참여 기준" value={stats.totalStudentCount} unit="명">
            <StudentCountChart data={stats.studentCountTrend} total={stats.totalStudentCount} />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
