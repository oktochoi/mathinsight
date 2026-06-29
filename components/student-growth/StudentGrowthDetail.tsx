'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { StudentGrowthChart } from '@/components/dashboard/StudentGrowthCard';
import { cn } from '@/lib/cn';
import type { StudentGrowthMetrics } from '@/lib/studentGrowth';

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm"
    >
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  unit = '명',
  sub,
}: {
  label: string;
  value: number;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
        {value}
        <span className="text-sm font-medium text-slate-400 ml-0.5">{unit}</span>
      </p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarList({ items, empty }: { items: { name: string; count: number }[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((item) => (
        <li key={item.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-800">{item.name}</span>
            <span className="text-slate-500 tabular-nums">{item.count}명</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-800/80"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StudentGrowthDetail({
  metrics,
  afterReregistration,
  footer,
}: {
  metrics: StudentGrowthMetrics;
  afterReregistration?: ReactNode;
  footer?: ReactNode;
}) {
  const [chartRange, setChartRange] = useState<6 | 12>(6);
  const trend = chartRange === 6 ? metrics.trend6 : metrics.trend12;

  return (
    <div className="space-y-8">
      <Section id="summary" title="성장 요약" description="이번 달 학원 재원·변화 한눈에">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <p className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight tabular-nums">
            {metrics.currentCount}
            <span className="text-lg font-semibold text-slate-400 ml-1.5">명</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">현재 재원 학생</p>
          <p
            className={cn(
              'text-sm font-medium mt-2 tabular-nums',
              metrics.monthDelta >= 0 ? 'text-emerald-600' : 'text-slate-500'
            )}
          >
            전월 대비 {metrics.monthDelta >= 0 ? '+' : ''}
            {metrics.monthDelta}명 ({metrics.monthDelta >= 0 ? '+' : ''}
            {metrics.monthDeltaPct}%)
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile
            label="이번 달 순증"
            value={metrics.netGrowthThisMonth}
            sub="신규+재등록−퇴원"
          />
          <StatTile label="신규 등록" value={metrics.monthlyChanges.newRegistrations} />
          <StatTile label="재등록" value={metrics.monthlyChanges.reregistrations} />
          <StatTile label="퇴원" value={metrics.monthlyChanges.withdrawals} />
          <StatTile label="휴원" value={metrics.monthlyChanges.onLeave} />
        </div>
      </Section>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-2">
          AI Growth Insight
        </p>
        <ul className="space-y-1.5">
          {metrics.insights.map((line, i) => (
            <li key={i} className="text-sm text-slate-700 leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <Section id="trend" title="학생 추이" description="월별 재원생·등록·퇴원">
        <div className="flex justify-end mb-3">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {([6, 12] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setChartRange(m)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-md',
                  chartRange === m ? 'bg-slate-900 text-white' : 'text-slate-500'
                )}
              >
                {m}개월
              </button>
            ))}
          </div>
        </div>
        <StudentGrowthChart data={trend} height={220} showGrid />
      </Section>

      <Section id="new" title="신규 등록 분석" description="이번 달 신규 등록 기준">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-3">학년별</p>
            <BarList items={metrics.newByGrade} empty="이번 달 신규 등록이 없습니다." />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-3">반별</p>
            <BarList items={metrics.newByClass} empty="반 배정 전 신규 등록만 있을 수 있습니다." />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-500 mb-3">담당 강사별</p>
            <BarList items={metrics.newByTeacher} empty="강사별 신규 배정 데이터가 없습니다." />
          </div>
        </div>
      </Section>

      <Section
        id="reregistration"
        title="재등록 분석"
        description="대상·완료·예정·미완료와 재등록률"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatTile label="대상" value={metrics.reregistration.total} />
          <StatTile label="완료" value={metrics.reregistration.completed} />
          <StatTile label="예정" value={metrics.reregistration.pending} />
          <StatTile label="미완료" value={metrics.reregistration.incomplete} />
        </div>
        <p className="text-3xl font-bold text-slate-900 tabular-nums mb-4">
          {metrics.reregistration.rate}%
          <span className="text-sm font-medium text-slate-400 ml-2">재등록률</span>
        </p>
        {metrics.attention.reregistrationPending > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-900">
              재등록 예정 <strong>{metrics.attention.reregistrationPending}명</strong> — 상담 후
              확정하세요.
            </p>
            <Link
              href="/counseling?step=session&type=reregistration"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 shrink-0"
            >
              재등록 상담 시작
            </Link>
          </div>
        )}
      </Section>

      {afterReregistration}

      <Section id="churn" title="이탈 분석" description="이번 달 퇴원 사유">
        {metrics.churnReasons.length === 0 ? (
          <p className="text-sm text-slate-400">이번 달 퇴원 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {metrics.churnReasons.map((c) => (
              <li
                key={c.reason}
                className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0"
              >
                <span className="text-slate-700">{c.reason}</span>
                <span className="font-semibold tabular-nums text-slate-900">{c.count}명</span>
              </li>
            ))}
          </ul>
        )}
        {metrics.attention.longAbsence > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-700">
              장기 결석 <strong>{metrics.attention.longAbsence}명</strong> — 퇴원 전 연락이 필요할
              수 있습니다.
            </p>
            <Link
              href="/lesson-logs"
              className="text-xs text-violet-600 hover:underline mt-1 inline-block"
            >
              출결 기록 확인 →
            </Link>
          </div>
        )}
      </Section>

      <Section id="ai-report" title="AI Growth Report" description="운영 관점 해석">
        <ul className="space-y-3">
          {metrics.aiReport.map((line, i) => (
            <li
              key={i}
              className="text-sm text-slate-700 leading-relaxed pl-4 border-l-2 border-indigo-200"
            >
              {line}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="prediction" title="AI 예측" description="다음 달 재원·상담 권장 학생">
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-slate-500">현재 학생</p>
              <p className="text-2xl font-bold tabular-nums">{metrics.prediction.current}명</p>
            </div>
            <div className="text-slate-300 hidden sm:block">↓</div>
            <div>
              <p className="text-xs text-slate-500">다음 달 예상</p>
              <p className="text-2xl font-bold tabular-nums">{metrics.prediction.nextMonth}명</p>
            </div>
            <div className="text-slate-300 hidden sm:block">↓</div>
            <div>
              <p className="text-xs text-slate-500">순증 예상</p>
              <p
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  metrics.prediction.netDelta >= 0 ? 'text-emerald-600' : 'text-slate-700'
                )}
              >
                {metrics.prediction.netDelta >= 0 ? '+' : ''}
                {metrics.prediction.netDelta}명
              </p>
            </div>
            <div className="text-slate-300 hidden sm:block">↓</div>
            <div>
              <p className="text-xs text-slate-500">상담 권장</p>
              <p className="text-2xl font-bold tabular-nums text-amber-700">
                {metrics.prediction.atRisk}명
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">예측 근거</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {metrics.prediction.rationale.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-300">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {footer}
    </div>
  );
}
