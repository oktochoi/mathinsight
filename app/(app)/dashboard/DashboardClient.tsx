'use client';

import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import { DashboardActionBoard } from '@/components/dashboard/DashboardActionBoard';
import { TeacherActionBoard } from '@/components/dashboard/TeacherActionBoard';
import { ConnectAcademyPanel } from '@/components/portal/ConnectAcademyPanel';

export default function DashboardClient() {
  const { profile, academy } = useAuth();
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;

  // 학원에 소속되지 않은 강사/원무 — 참여 안내
  const noAcademy =
    !academy &&
    (profile?.role === 'teacher' || profile?.role === 'desk');

  if (noAcademy) {
    return (
      <div className="max-w-md mx-auto py-10 space-y-4">
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <i className="ri-school-line text-blue-600 text-xl" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>학원에 참여하지 않았습니다</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                원장에게 받은 초대 코드를 입력하면 바로 사용할 수 있습니다.
              </p>
            </div>
          </div>
          <ConnectAcademyPanel />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="학원 운영을 시작해 보세요"
        description="학생을 등록하고 「오늘 수업」에서 출결·숙제를 입력하면, 운영 업무판에 오늘 할 일이 표시됩니다."
      />
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-7xl xl:max-w-[1440px] mx-auto pb-12">
      {stats.dashboardMode === 'teacher' ? (
        <TeacherActionBoard stats={stats} onRefresh={refetch} />
      ) : (
        <DashboardActionBoard stats={stats} onRefresh={refetch} />
      )}
    </div>
  );
}
