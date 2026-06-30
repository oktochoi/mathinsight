'use client';

import { useMemo, useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useStudentGrowth } from '@/hooks/useStudentGrowth';
import { useBillingCenter } from '@/hooks/useBillingCenter';
import { useRetention } from '@/hooks/useRetention';
import { useCounselingSessions } from '@/hooks/useCounselingSessions';
import { useIntakeConsultations } from '@/hooks/useIntakeConsultations';
import { useToast } from '@/hooks/useToast';
import { ManagementReportView } from '@/components/management-report/ManagementReportView';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { Toast } from '@/components/ui/Toast';
import { STAFF_PAGES } from '@/lib/staffPages';
import {
  billingCollectionRate,
  buildActionCenter,
  buildAiInsights,
  buildClassAnalysis,
  buildCounselingFunnel,
  buildMonthlySummary,
  buildPerformanceMetrics,
  monthLabel,
} from '@/lib/managementReport';

export default function AnalyticsPageClient() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { metrics: growth, loading: growthLoading, error: growthError, refetch: refetchGrowth } =
    useStudentGrowth();
  const billing = useBillingCenter();
  const {
    signals,
    records,
    loading: retentionLoading,
    error: retentionError,
    scanning,
    runScan,
    refetch: refetchRetention,
  } = useRetention();
  const { sessions } = useCounselingSessions();
  const { intakes } = useIntakeConsultations();
  const { message: toast, show: showToast } = useToast(3500);

  const loading = statsLoading || growthLoading || billing.loading || retentionLoading;
  const error = statsError || growthError || retentionError;

  const report = useMemo(() => {
    if (!stats || !growth) return null;

    const classRows = buildClassAnalysis(billing.classes, billing.students, growth);
    const intakePending = intakes.filter((i) =>
      ['scheduled', 'on_hold'].includes(i.intake_status)
    ).length;

    return {
      monthlySummary: buildMonthlySummary(growth, stats, billing.kpis),
      performance: buildPerformanceMetrics(stats),
      classRows,
      funnel: buildCounselingFunnel(sessions, intakes),
      collectionRate: billingCollectionRate(billing.kpis),
      actions: buildActionCenter({
        classRows,
        billing: billing.kpis,
        stats,
        growth,
        intakePending,
      }),
      aiInsights: buildAiInsights(growth, stats, billing.insights),
    };
  }, [stats, growth, billing.classes, billing.students, billing.kpis, billing.insights, sessions, intakes]);

  const handleScan = async () => {
    const result = await runScan();
    if (result.error) {
      showToast(result.error);
      return;
    }
    showToast(`${result.scanned}명 스캔 완료.`);
    void refetchGrowth();
  };

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <ErrorBanner
        message={error}
        onRetry={() => {
          void refetchStats();
          void refetchGrowth();
          void refetchRetention();
        }}
      />
    );
  }
  if (!stats || !growth || !report) return null;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-5xl mx-auto pb-8">
      <PageHeader
        title="경영 리포트"
        description={STAFF_PAGES.analytics.description}
      />

      <Toast message={toast} />

      <ManagementReportView
        monthLabel={monthLabel()}
        monthlySummary={report.monthlySummary}
        growth={growth}
        performance={report.performance}
        classRows={report.classRows}
        funnel={report.funnel}
        billing={billing.kpis}
        collectionRate={report.collectionRate}
        actions={report.actions}
        aiInsights={report.aiInsights}
        retentionSignals={signals}
        reregRecords={records}
        scanning={scanning}
        onScan={() => void handleScan()}
      />
    </div>
  );
}
