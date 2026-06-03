'use client';

import Link from 'next/link';
import { LessonFlowCard } from '@/components/flow/LessonFlowCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import { StaffDailyFlow } from '@/components/ui/StaffDailyFlow';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { AgentArchitecturePanel } from '@/components/dashboard/AgentArchitecturePanel';
import { DashboardAgentCenter } from '@/components/dashboard/DashboardAgentCenter';
import { DashboardAiAssist } from '@/components/dashboard/DashboardAiAssist';
import { useDashboardAgent } from '@/hooks/useDashboardAgent';
import { RISK_KIND_STYLES } from '@/lib/studentRisk';

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export default function DashboardClient() {
  const { stats, loading, error, refetch } = useDashboardStats();
  const agent = useDashboardAgent({ refreshRiskOnLoad: true });

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!stats) {
    return (
      <EmptyState
        title="아직 학생·수업 기록이 없습니다"
        description="「학생 관리」에서 학생을 등록하고, 「수업 기록」에서 오늘 수업을 입력하면 이 화면이 채워집니다."
      />
    );
  }

  const needActionCount = stats.attentionStudents.length;
  const kpis = [
    {
      label: '오늘 수업',
      sub: '시간표에 잡힌 수업 수',
      value: stats.todayLessonCount,
      href: '/schedule',
      accent: 'text-indigo-600',
    },
    {
      label: '지금 조치할 학생',
      sub: '상담·보강이 필요한 학생',
      value: needActionCount,
      href: '/students',
      accent: needActionCount > 0 ? 'text-violet-600' : 'text-slate-900',
    },
    {
      label: '오늘 숙제 미제출',
      sub: '오늘 수업 기록 기준',
      value: stats.missingHomeworkCount,
      href: '/lesson-logs',
      accent: stats.missingHomeworkCount > 0 ? 'text-amber-600' : 'text-slate-900',
    },
  ];

  return (
    <div className="space-y-6 w-full min-w-0 max-w-6xl mx-auto">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{todayLabel()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            오늘 할 일
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-lg leading-relaxed">
            원장님께 필요한 것만 모았습니다.{' '}
            <strong className="text-slate-800">수업 기록 → 조치할 학생 확인</strong> 순서로
            보시면 됩니다.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/lesson-logs"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            <i className="ri-edit-line" />
            수업 기록 입력
          </Link>
          <button
            type="button"
            onClick={refetch}
            className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
            aria-label="새로고침"
          >
            <i className="ri-refresh-line text-lg" />
          </button>
        </div>
      </header>

      <StaffDailyFlow />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 tabular-nums ${k.accent}`}>{k.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>
          </Link>
        ))}
      </div>

      {stats.pendingConsultationCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              상담 카드 {stats.pendingConsultationCount}건 — 아직 상담 전입니다
            </p>
            <p className="text-xs text-amber-800/90 mt-1">
              상담을 마치셨다면 「완료 처리」를 눌러 주세요. 학부모에게 보낼 문구는 카드에
              적혀 있습니다.
            </p>
          </div>
          <Link
            href="/consultation-cards"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 shrink-0"
          >
            상담 카드 열기
          </Link>
        </div>
      )}

      <ActionCenter items={stats.todayPriorities} />

      {/* ① 가장 중요: 바로 연락·상담할 학생 */}
      <section className="rounded-2xl border-2 border-violet-200/90 bg-white overflow-hidden shadow-sm shadow-violet-100/50">
        <div className="px-5 py-4 border-b border-violet-100 bg-violet-50/50">
          <p className="text-xs font-bold text-violet-800">① 오늘 가장 먼저 보세요</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">지금 조치할 학생</h2>
          <p className="text-sm text-slate-600 mt-1">
            상담·보강이 필요하다고 판단된 학생만 표시합니다. 양호한 학생은 나오지 않습니다.
          </p>
        </div>
        {stats.attentionStudents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-base font-medium text-slate-700">오늘은 특별히 조치할 학생이 없습니다</p>
            <p className="text-sm text-slate-500 mt-2">
              수업 기록을 계속 입력하시면, 점수·숙제가 나빠질 때 자동으로 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.attentionStudents.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/students/${s.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-violet-50/30 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-800 shrink-0">
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {s.name}
                      <span className="text-slate-400 font-normal text-sm ml-1.5">{s.grade}</span>
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{s.reason}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      RISK_KIND_STYLES[s.riskKind ?? (s.urgency === 'high' ? 'consultation' : 'makeup')]
                    }`}
                  >
                    {s.riskKindLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <Link href="/students" className="text-sm font-medium text-indigo-600 hover:underline">
            전체 학생 목록 보기
          </Link>
        </div>
      </section>

      {/* ② 유형별 분류 */}
      {agent.error ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          자동 분류를 불러오지 못했습니다. 위 「조치할 학생」 목록은 정상적으로 보입니다. (
          {agent.error})
        </p>
      ) : (
        <DashboardAgentCenter insight={agent.insight} />
      )}

      {/* ③ 오늘 수업 */}
      <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500">② 오늘 일정</p>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">오늘 수업</h2>
            <p className="text-xs text-slate-500 mt-0.5">카드를 누르면 수업 준비·기록 화면으로 이동합니다</p>
          </div>
          <Link href="/schedule" className="text-sm text-indigo-600 hover:underline font-medium shrink-0">
            시간표 수정
          </Link>
        </div>
        {stats.todayLessons.length > 0 ? (
          <ul className="p-4 space-y-2">
            {stats.todayLessons.map((item) => (
              <LessonFlowCard key={item.event.id} item={item} compact />
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600">오늘 등록된 수업이 없습니다.</p>
            <Link href="/schedule" className="text-sm text-indigo-600 hover:underline mt-2 inline-block font-medium">
              시간표에서 수업 추가하기
            </Link>
          </div>
        )}
      </section>

      {/* ④ AI 자동 도움 (접기 가능) */}
      <DashboardAiAssist
        notifications={agent.notifications}
        jobs={agent.jobs}
        feed={agent.feed}
        loading={agent.loading}
      />

      <AgentArchitecturePanel
        insight={agent.insight}
        logs={agent.logs}
        loading={agent.loading}
      />
    </div>
  );
}
