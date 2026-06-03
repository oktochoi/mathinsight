'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { parentReportPath } from '@/lib/documentRoutes';
import { sanitizeParentReportText } from '@/lib/parentReportFormat';
import { useAuth } from '@/context/AuthContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import type { Student } from '@/types/database';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { ParentAgentChat } from '@/components/portal/ParentAgentChat';
import { fetchParentLinkedStudents } from '@/lib/portalStudents';
import { buildParentRecentChanges } from '@/lib/learningFlow';
import { cn } from '@/lib/cn';

export default function ParentPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { students, error: err } = await fetchParentLinkedStudents(profile.id);

    if (err) setError('자녀 정보를 불러오지 못했습니다.');
    else {
      setChildren(students);
      if (students[0]) setSelectedId(students[0].id);
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const child = children.find((c) => c.id === selectedId);
  const { logs } = useLessonLogs({ studentId: selectedId, limit: 30 });
  const { reports, loading: reportsLoading } = useParentReports(selectedId);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  if (children.length === 0) {
    return (
      <div className="space-y-6 flex flex-col items-center max-w-lg mx-auto py-8">
        <EmptyState
          title="연결된 자녀가 없습니다"
          description="학원에서 학생 등록 시 입력한 학부모 이메일과 동일한 계정으로 가입·로그인해야 합니다. 연결 후 수업·리포트를 볼 수 있습니다."
        />
        <p className="text-sm text-slate-600 max-w-md text-center leading-relaxed">
          로그인 이메일: <strong className="text-slate-900">{profile?.email}</strong>
          <br />
          원장이 Students에서 해당 이메일을 저장한 뒤, 다시 저장하면 연결됩니다.
        </p>
      </div>
    );
  }

  const summary = child ? generateLearningSummary(logs, child.name) : '';
  const scoreTrend = calculateScoreTrend(logs);
  const scoreChart = scoreTrend.points;
  const hw = calculateHomeworkTrend(logs);
  const recentChanges = buildParentRecentChanges(logs);
  const latestScore = scoreChart.length > 0 ? scoreChart[scoreChart.length - 1].score : null;
  const academyName =
    (child as Student & { academies?: { name: string } })?.academies?.name ?? '학원';

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-8 pb-10">
      {child && (
        <>
          <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">
              {academyName}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{child.name}</h1>
            <p className="text-base text-slate-600 mt-1">{child.grade}</p>

            {children.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-colors',
                      c.id === selectedId
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-violet-300'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase">최근 점수</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {latestScore != null ? `${latestScore}점` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase">숙제 제출</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {logs.length > 0 ? `${hw.recentRate}%` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase">수업 기록</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {logs.length}건
                </p>
              </div>
            </div>
          </header>

          <ParentAgentChat studentId={child.id} studentName={child.name} />

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="ri-bar-chart-line text-violet-600" aria-hidden />
              학습 현황
            </h2>

            <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2">학습 요약</h3>
              <p className="text-[15px] text-slate-700 leading-relaxed">{summary}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">점수 추이</h3>
                {scoreChart.length === 0 ? (
                  <p className="text-sm text-slate-500">아직 점수 기록이 없습니다.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={scoreChart}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#7c3aed"
                        fill="#7c3aed"
                        fillOpacity={0.12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">최근 변화</h3>
                <ul className="text-sm text-slate-700 space-y-2 leading-relaxed">
                  {recentChanges.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-500 shrink-0">·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">이번 주 수업 일정</h3>
              <PortalSchedule classIds={child.class_id ? [child.class_id] : []} />
            </div>
          </section>

          <section className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">학부모 리포트</h3>
            <p className="text-xs text-slate-500 mb-3">
              원장이 작성·저장한 기간별 안내 문서입니다. Agent와는 별도입니다.
            </p>
            {reportsLoading ? (
              <PageLoader />
            ) : reports.length === 0 ? (
              <p className="text-sm text-slate-500">발송된 리포트가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {reports.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={parentReportPath(r.id, 'parent')}
                      className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-violet-700">
                        {r.created_at.slice(0, 10)} 리포트
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {sanitizeParentReportText(r.report_text)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
