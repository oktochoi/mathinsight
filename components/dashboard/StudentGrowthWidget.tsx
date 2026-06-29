'use client';

import { useStudentGrowth } from '@/hooks/useStudentGrowth';
import { StudentGrowthCard } from '@/components/dashboard/StudentGrowthCard';
import { DashboardCard } from '@/components/dashboard/DashboardPrimitives';

/** Dashboard — Student Growth 운영 카드 */
export function StudentGrowthWidget({ chartPlaceholder = false }: { chartPlaceholder?: boolean }) {
  const { metrics, loading, error } = useStudentGrowth();

  if (loading) {
    return (
      <DashboardCard size="lg" className="min-h-[320px] animate-pulse">
        <div className="h-6 w-32 rounded mb-8" style={{ background: 'var(--app-surface-2)' }} />
        <div className="h-12 w-40 rounded mb-6" style={{ background: 'var(--app-surface-2)' }} />
        <div className="h-24 rounded" style={{ background: 'var(--app-surface-2)' }} />
      </DashboardCard>
    );
  }

  if (error || !metrics) {
    return (
      <DashboardCard size="lg">
        <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>학생 성장 데이터를 불러오지 못했습니다.</p>
      </DashboardCard>
    );
  }

  return <StudentGrowthCard metrics={metrics} chartPlaceholder={chartPlaceholder} />;
}
