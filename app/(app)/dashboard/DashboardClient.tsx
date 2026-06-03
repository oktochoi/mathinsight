'use client';

import Link from 'next/link';
import { LessonFlowCard } from '@/components/flow/LessonFlowCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import { StaffDailyFlow } from '@/components/ui/StaffDailyFlow';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { STAFF_PAGES } from '@/lib/staffPages';
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
  const guide = STAFF_PAGES.dashboard;

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!stats) {
    return (
      <EmptyState
        title="학원 데이터가 없습니다"
        description="학생 관리에서 학생을 등록한 뒤 수업 기록을 입력하세요."
      />
    );
  }

  const kpis = [
    {
      label: '오늘 수업',
      sub: '시간표 기준',
      value: stats.todayLessonCount,
      href: '/schedule',
      accent: 'text-indigo-600',
    },
    {
      label: '조치 필요',
      sub: '상담·보강 권장',
      value: stats.attentionStudents.length,
      href: '/students',
      accent: stats.attentionStudents.length > 0 ? 'text-violet-600' : 'text-slate-900',
    },
    {
      label: '오늘 숙제 미제출',
      sub: '기록된 수업만',
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
            {guide.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{guide.description}</p>
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

      <div className="grid grid-cols-3 gap-3">
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
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          상담 카드 <strong>{stats.pendingConsultationCount}건</strong>이 아직 「완료」 처리 전입니다.{' '}
          <Link href="/consultation-cards" className="font-semibold underline">
            상담 카드에서 처리
          </Link>
        </p>
      )}

      <ActionCenter items={stats.todayPriorities} />

      <div className="space-y-6 min-w-0">
          {stats.todayLessons.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">오늘 수업</h2>
                  <p className="text-xs text-slate-500 mt-0.5">카드를 누르면 수업 준비·기록으로 이동</p>
                </div>
                <Link href="/schedule" className="text-xs text-indigo-600 hover:underline font-medium shrink-0">
                  시간표
                </Link>
              </div>
              <ul className="p-4 space-y-2">
                {stats.todayLessons.map((item) => (
                  <LessonFlowCard key={item.event.id} item={item} compact />
                ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">오늘 일정이 없습니다.</p>
              <Link href="/schedule" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
                시간표에서 수업 등록
              </Link>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">조치가 필요한 학생</h2>
                <p className="text-xs text-slate-500 mt-0.5">상담·보강 권장만 (양호·가벼운 주의는 제외)</p>
              </div>
              <Link href="/students" className="text-xs text-indigo-600 hover:underline font-medium">
                학생 관리
              </Link>
            </div>
            {stats.attentionStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                상담·보강이 필요한 학생이 없습니다. 대부분 양호한 상태입니다.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.attentionStudents.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {s.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {s.name}
                          <span className="text-slate-400 font-normal text-sm ml-1.5">{s.grade}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{s.reason}</p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
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
          </section>

      </div>
    </div>
  );
}
