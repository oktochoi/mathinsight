'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { formatWon } from '@/lib/billingOperations';
import type { BillingKpis } from '@/lib/billingOperations';
import type {
  ClassAnalysisRow,
  CounselingFunnel,
  PerformanceMetric,
  ReportAction,
} from '@/lib/managementReport';
import type { StudentGrowthMetrics } from '@/lib/studentGrowth';
import { RetentionDataTable } from '@/components/retention/RetentionDataTable';
import type { RetentionSignal, ReregistrationRecord } from '@/types/database';
import { REREGISTRATION_STATUS_LABELS } from '@/hooks/useRetention';
import { EmptyState } from '@/components/ui/DataStates';
import {
  ClassStudentChart,
  CounselingFunnelChart,
  GrowthTrendChart,
  RevenueCompareChart,
} from '@/components/management-report/ManagementReportCharts';

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function BigKpi({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: 'var(--app-ink-3)' }}>
        {label}
      </p>
      <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--app-ink)' }}>
        {value}
        {unit && <span className="text-lg font-semibold ml-0.5" style={{ color: 'var(--app-ink-4)' }}>{unit}</span>}
      </p>
      {sub && <p className="text-xs" style={{ color: 'var(--app-ink-4)' }}>{sub}</p>}
    </div>
  );
}

function PerformanceCard({ metric }: { metric: PerformanceMetric }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--app-ink-3)' }}>
        {metric.label}
      </p>
      <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--app-ink)' }}>
        {metric.value}
        <span className="text-base font-semibold" style={{ color: 'var(--app-ink-4)' }}>%</span>
      </p>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--app-ink-4)' }}>목표 {metric.target}%</span>
        <span
          className={cn('font-semibold', metric.met ? 'text-[var(--app-success)]' : 'text-[var(--app-warning)]')}
        >
          {metric.met ? '✓ 목표 달성' : '목표 미달'}
        </span>
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: ReportAction }) {
  const toneClass =
    action.tone === 'urgent'
      ? 'app-banner-danger'
      : action.tone === 'warning'
        ? 'app-banner-warning'
        : '';

  return (
    <Link
      href={action.href}
      className={cn(
        'rounded-xl p-4 flex items-center justify-between gap-3 transition-opacity hover:opacity-85',
        toneClass || 'border border-[var(--app-border)] bg-[var(--app-surface)]'
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
          {action.title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>
          {action.description}
        </p>
      </div>
      <i className="ri-arrow-right-s-line shrink-0" style={{ color: 'var(--app-ink-4)' }} />
    </Link>
  );
}

export type ManagementReportViewProps = {
  monthLabel: string;
  monthlySummary: string[];
  growth: StudentGrowthMetrics;
  performance: PerformanceMetric[];
  classRows: ClassAnalysisRow[];
  funnel: CounselingFunnel;
  billing: BillingKpis;
  collectionRate: number;
  actions: ReportAction[];
  aiInsights: string[];
  retentionSignals: RetentionSignal[];
  reregRecords: ReregistrationRecord[];
  scanning: boolean;
  onScan: () => void;
};

export function ManagementReportView({
  monthLabel,
  monthlySummary,
  growth,
  performance,
  classRows,
  funnel,
  billing,
  collectionRate,
  actions,
  aiInsights,
  retentionSignals,
  reregRecords,
  scanning,
  onScan,
}: ManagementReportViewProps) {
  const sortedSignals = [...retentionSignals].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk_level] - order[b.risk_level] || b.score - a.score;
  });

  return (
    <div className="space-y-12 pb-16 max-w-4xl mx-auto">
      {/* 원장 의사결정 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <BigKpi
            label="이번 달 순증"
            value={`${growth.netGrowthThisMonth >= 0 ? '+' : ''}${growth.netGrowthThisMonth}`}
            unit="명"
            sub={`신규 ${growth.monthlyChanges.newRegistrations} · 퇴원 ${growth.monthlyChanges.withdrawals}`}
          />
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <BigKpi label="수납률" value={collectionRate} unit="%" sub="청구 대비 실납부" />
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <BigKpi
            label="출석률"
            value={performance.find((p) => p.key === 'attendance')?.value ?? '—'}
            unit="%"
            sub="학원 전체"
          />
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <BigKpi
            label="상담 완료율"
            value={performance.find((p) => p.key === 'counseling')?.value ?? '—'}
            unit="%"
            sub={
              funnel.booked > 0
                ? `예약 ${funnel.booked}건 중 ${funnel.completed}건 완료`
                : 'AI·상담 활용'
            }
          />
        </div>
      </div>

      {/* 1. 월간 운영 요약 */}
      <div
        className="rounded-2xl p-6 sm:p-8 space-y-4"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--app-ink-4)' }}>
          {monthLabel} 운영 요약
        </p>
        <ul className="space-y-2.5">
          {monthlySummary.map((line, i) => (
            <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--app-ink-2)' }}>
              <span style={{ color: 'var(--app-accent)' }}>·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Action Center — 상단 근처 배치 (중요) */}
      <Section title="운영 Action Center" description="지금 바로 처리할 항목">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      </Section>

      {/* 2. 학원 성장 */}
      <Section title="학원 성장" description="재원·등록·퇴원 흐름">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <BigKpi label="현재 재원생" value={growth.currentCount} unit="명" />
          <BigKpi
            label="신규 등록"
            value={growth.monthlyChanges.newRegistrations}
            unit="명"
            sub="이번 달"
          />
          <BigKpi
            label="퇴원"
            value={growth.monthlyChanges.withdrawals}
            unit="명"
            sub="이번 달"
          />
          <BigKpi
            label="순증"
            value={`${growth.netGrowthThisMonth >= 0 ? '+' : ''}${growth.netGrowthThisMonth}`}
            unit="명"
            sub={growth.monthDeltaPct !== 0 ? `전월 대비 ${growth.monthDeltaPct > 0 ? '+' : ''}${growth.monthDeltaPct}%` : undefined}
          />
        </div>
        <GrowthTrendChart growth={growth} />
      </Section>

      {/* 3. 운영 성과 */}
      <Section title="운영 성과" description="이번 달 목표 대비">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {performance.map((m) => (
            <PerformanceCard key={m.key} metric={m} />
          ))}
        </div>
      </Section>

      {/* 4. 반 분석 */}
      <Section title="반 분석" description="반별 재원 현황">
        {classRows.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>등록된 반이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {classRows.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                    {c.name}
                    <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--app-ink-4)' }}>
                      {c.grade}
                    </span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    학생 {c.studentCount}명
                  </p>
                </div>
                <span
                  className={cn('text-sm font-bold tabular-nums shrink-0')}
                  style={{ color: c.delta > 0 ? 'var(--app-success)' : c.delta < 0 ? 'var(--app-danger)' : 'var(--app-ink-4)' }}
                >
                  {c.delta > 0 ? `▲ +${c.delta}` : c.delta < 0 ? `▼ ${c.delta}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
        <ClassStudentChart rows={classRows} />
      </Section>

      {/* 5. 상담 분석 */}
      <Section title="상담 분석" description="상담 → 등록 전환 흐름">
        {funnel.placeholder ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--app-ink-3)' }}>
            상담·신입 데이터가 쌓이면 전환 차트가 표시됩니다.
          </p>
        ) : (
          <>
            <CounselingFunnelChart funnel={funnel} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {[
              { label: '상담 예약', value: funnel.booked },
              { label: '상담 완료', value: funnel.completed },
              { label: '등록 완료', value: funnel.registered },
              {
                label: '등록 전환율',
                value: funnel.conversionRate != null ? `${funnel.conversionRate}%` : '—',
              },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-1">
                <p className="text-xs" style={{ color: 'var(--app-ink-4)' }}>
                  {item.label}
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--app-ink)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          </>
        )}
      </Section>

      {/* 6. 수납 운영 */}
      <Section title="수납 운영" description="Billing 요약">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          <BigKpi label="이번 달 수납" value={formatWon(billing.collectedThisMonth)} />
          <BigKpi label="미수금" value={formatWon(billing.outstanding)} sub={`${billing.outstandingStudentCount}명`} />
          <BigKpi label="연체" value={billing.overdueStudentCount} unit="명" />
          <BigKpi label="수납률" value={collectionRate} unit="%" />
        </div>
        <RevenueCompareChart billing={billing} />
        <Link href="/billing" className="text-xs font-medium inline-block mt-3 hover:opacity-70" style={{ color: 'var(--app-accent)' }}>
          수납 관리에서 상세 보기 →
        </Link>
      </Section>

      {/* 통합: 재등록·학습 신호 (구 학생 성장) */}
      <Section
        id="attention"
        title="재등록·학습 신호"
        description="상담·연락이 필요한 학생"
      >
        <div className="flex justify-end mb-3">
          <button
            type="button"
            disabled={scanning}
            onClick={onScan}
            className="app-btn app-btn-ghost app-btn-sm disabled:opacity-50"
          >
            {scanning ? '스캔 중…' : '학습 신호 갱신'}
          </button>
        </div>
        <RetentionDataTable signals={sortedSignals} loading={false} />
      </Section>

      {reregRecords.length > 0 && (
        <Section title="재등록 진행 기록" description="상담 후 재등록 상태">
          <ul
            className="rounded-2xl overflow-hidden divide-y"
            style={{ border: '1px solid var(--app-border)' }}
          >
            {reregRecords.slice(0, 10).map((r) => (
              <li key={r.id} className="px-4 py-3 flex flex-wrap items-center gap-2 bg-[var(--app-surface)]">
                <span className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {r.students?.name ?? '학생'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}>
                  {REREGISTRATION_STATUS_LABELS[r.status] ?? r.status}
                </span>
                <Link href={`/students/${r.student_id}`} className="text-xs ml-auto" style={{ color: 'var(--app-accent)' }}>
                  상세 →
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* AI 예측 (기존 학생 성장) */}
      <Section title="AI 예측" description="다음 달 재원·상담 권장">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <BigKpi label="현재" value={growth.prediction.current} unit="명" />
          <BigKpi label="다음 달 예상" value={growth.prediction.nextMonth} unit="명" />
          <BigKpi
            label="순증 예상"
            value={`${growth.prediction.netDelta >= 0 ? '+' : ''}${growth.prediction.netDelta}`}
            unit="명"
          />
          <BigKpi label="상담 권장" value={growth.prediction.atRisk} unit="명" />
        </div>
        {growth.prediction.rationale.length > 0 && (
          <ul className="text-xs space-y-1" style={{ color: 'var(--app-ink-3)' }}>
            {growth.prediction.rationale.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* 8. AI 운영 인사이트 */}
      <Section title="AI 운영 인사이트" description="데이터 기반 개선 제안">
        {aiInsights.length === 0 ? (
          <EmptyState title="인사이트 없음" description="데이터가 쌓이면 AI 해석이 표시됩니다." />
        ) : (
          <ul className="space-y-3">
            {aiInsights.map((line, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed pl-4 border-l-2"
                style={{ color: 'var(--app-ink-2)', borderColor: 'var(--app-accent)' }}
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
