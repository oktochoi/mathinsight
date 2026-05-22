'use client';

import Link from 'next/link';
import { parentReportPath } from '@/lib/documentRoutes';
import { LessonFlowCard } from '@/components/flow/LessonFlowCard';
import { cn } from '@/lib/cn';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { STATUS_LABELS } from '@/lib/statusLabels';

const activityColors: Record<string, string> = {
  lesson: 'bg-blue-50 text-blue-600',
  test: 'bg-amber-50 text-amber-600',
  homework: 'bg-red-50 text-red-600',
  consult: 'bg-indigo-50 text-indigo-600',
  report: 'bg-emerald-50 text-emerald-600',
};

export default function DashboardClient() {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={refetch} />;
  if (!stats) {
    return (
      <EmptyState
        title="학원 데이터가 없습니다"
        description="회원가입 후 학생과 수업 기록을 추가하세요."
      />
    );
  }

  const summaryCards = [
    {
      title: '오늘 수업',
      value: String(stats.todayLessonCount),
      sub: `${stats.todayClassCount}개 반`,
      icon: 'ri-book-open-line',
    },
    {
      title: '미제출 학생',
      value: String(stats.missingHomeworkCount),
      sub: '오늘 기록 기준',
      icon: 'ri-error-warning-line',
    },
    {
      title: '상담 권장',
      value: String(stats.consultationRecommendedCount),
      sub: '상태 기준',
      icon: 'ri-message-3-line',
    },
    {
      title: '성적 하락',
      value: String(stats.scoreDeclineCount),
      sub: '추세 분석',
      icon: 'ri-arrow-down-line',
    },
  ];

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      <PageHeader title="Dashboard" description="실제 DB 기록 기준 현황">
          <Link href="/lesson-logs" className="w-full sm:w-auto">
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1e32)' }}
            >
              <i className="ri-edit-line"></i>수업 기록 입력
            </button>
          </Link>
          <button
            type="button"
            onClick={refetch}
            className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="새로고침"
          >
            <i className="ri-refresh-line text-slate-500"></i>
          </button>
      </PageHeader>

      {stats.todayLessons.length > 0 && (
        <section className="rounded-2xl p-5 sm:p-6 bg-indigo-50 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-indigo-950">오늘 수업</h3>
            <Link href="/schedule" className="text-xs text-indigo-600 hover:underline">
              시간표 전체 →
            </Link>
          </div>
          <ul className="space-y-3">
            {stats.todayLessons.map((item) => (
              <LessonFlowCard key={item.event.id} item={item} compact />
            ))}
          </ul>
        </section>
      )}

      {stats.classFlows.length > 0 && (
        <section className="rounded-2xl p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-bold mb-4">반별 흐름</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.classFlows.slice(0, 6).map((cf) => (
              <div key={cf.classId} className="rounded-xl border border-slate-100 p-4 text-sm">
                <p className="font-semibold">
                  {cf.className} <span className="text-slate-400 font-normal">({cf.grade})</span>
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-0.5">
                  {cf.avgScore != null && <li>평균 점수 {cf.avgScore}점 (최근 2주)</li>}
                  <li>숙제 완료율 {cf.homeworkRate}%</li>
                  {cf.recentUnit && <li>최근 단원: {cf.recentUnit}</li>}
                  <li>관리 필요 {cf.attentionCount}명</li>
                  {cf.nextLesson && (
                    <li>
                      다음 수업: {cf.nextLesson.date.slice(5)} {cf.nextLesson.startTime.slice(0, 5)}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200 min-w-0">
            <i className={`${card.icon} text-blue-600 text-lg mb-2 block`}></i>
            <p className="text-xs text-slate-500">{card.title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 min-w-0">
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold mb-4">관리 필요 학생</h3>
          {stats.attentionStudents.length === 0 ? (
            <EmptyState title="특별히 관리할 학생이 없습니다" />
          ) : (
            <div className="space-y-3">
              {stats.attentionStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {s.name}{' '}
                      <span className="text-slate-400 font-normal">
                        {s.grade} · {s.className}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{s.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100">
                      {STATUS_LABELS[s.status]}
                    </span>
                    <Link href={`/students/${s.id}`}>
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer">
                        보기
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 bg-white border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold mb-4">최근 학부모 리포트</h3>
          {stats.recentReports.length === 0 ? (
            <EmptyState title="리포트 없음" />
          ) : (
            <ul className="space-y-3">
              {stats.recentReports.map((r) => (
                <li key={r.id} className="text-sm border-b border-slate-50 pb-2 last:border-0">
                  <Link
                    href={parentReportPath(r.id)}
                    className="block hover:bg-slate-50 -mx-1 px-1 py-1 rounded-lg group"
                  >
                    <p className="font-semibold group-hover:text-indigo-700">
                      {(r.students as { name?: string })?.name ?? '학생'} · {r.period_start} ~{' '}
                      {r.period_end}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.created_at.slice(0, 10)} · 자세히 보기 →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 min-w-0">
        <div className="rounded-2xl p-6 bg-white border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold mb-4">숙제 제출율 추이</h3>
          {stats.homeworkTrend.length === 0 ? (
            <EmptyState title="데이터 없음" />
          ) : (
            <div className="w-full min-w-0 h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.homeworkTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-2xl p-6 bg-white border border-slate-200 min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold mb-4">학년별 평균 점수</h3>
          {stats.classScoreTrend.length === 0 ? (
            <EmptyState title="점수 기록 없음" />
          ) : (
            <div className="w-full min-w-0 h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.classScoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="avg" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white border border-slate-200 min-w-0 overflow-hidden">
        <h3 className="text-sm font-bold mb-4">최근 운영 흐름</h3>
        {stats.recentActivities.length === 0 ? (
          <EmptyState title="활동 기록 없음" />
        ) : (
          <ul className="space-y-2">
            {stats.recentActivities.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${activityColors[a.type] ?? activityColors.lesson}`}
                >
                  <i className="ri-book-open-line text-xs"></i>
                </span>
                <span className="text-slate-400 text-xs w-12">{a.time}</span>
                <span className="text-slate-700">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
