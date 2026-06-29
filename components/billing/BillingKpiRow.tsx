'use client';

import { KpiMetric } from '@/components/data-ui/KpiMetric';
import { formatWon, type BillingKpis } from '@/lib/billingOperations';

export function BillingKpiRow({ kpis }: { kpis: BillingKpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <KpiMetric
        label="이번 달 수납"
        value={formatWon(kpis.collectedThisMonth)}
        delta={kpis.collectedMonthDeltaPct !== 0 ? kpis.collectedMonthDeltaPct : null}
        deltaLabel="전월 대비"
        accent="green"
        size="lg"
      />
      <KpiMetric
        label="미수금"
        value={formatWon(kpis.outstanding)}
        unit={` · 학생 ${kpis.outstandingStudentCount}명`}
        accent="orange"
        size="lg"
      />
      <KpiMetric
        label="오늘 입금"
        value={formatWon(kpis.todayCollected)}
        unit={` · ${kpis.todayCollectedCount}건`}
        accent="blue"
        size="lg"
      />
      <KpiMetric
        label="다음 7일 입금 예정"
        value={formatWon(kpis.dueNext7Days)}
        unit={` · ${kpis.dueNext7DaysCount}건`}
        accent="indigo"
        size="lg"
      />
      <KpiMetric
        label="AI 위험"
        value={kpis.aiRiskCount}
        unit="명"
        accent="red"
        size="lg"
      />
    </div>
  );
}
