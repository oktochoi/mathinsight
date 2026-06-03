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
import { ParentPortalGuide } from '@/components/portal/ParentPortalGuide';
import { ParentAgentChat } from '@/components/portal/ParentAgentChat';
import { ParentRecentLessons } from '@/components/portal/ParentRecentLessons';
import { ParentScoreChart } from '@/components/portal/ParentScoreChart';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { PortalSection, PortalStat, PortalSubheading } from '@/components/portal/ParentUI';
import { fetchParentLinkedStudents } from '@/lib/portalStudents';
import { buildParentRecentChanges } from '@/lib/learningFlow';
import { cn } from '@/lib/cn';

function homeworkHint(rate: number, hasLogs: boolean): { text: string; warn: boolean } {
  if (!hasLogs) return { text: '—', warn: false };
  if (rate >= 85) return { text: '잘 하고 있어요', warn: false };
  if (rate >= 60) return { text: '가끔 빠뜨려요', warn: true };
  return { text: '챙겨 주세요', warn: true };
}

function pickDefaultChild(students: Student[], userId: string): string {
  const linked = students.find((s) => s.parent_user_id === userId);
  if (linked) return linked.id;
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return sorted[0]?.id ?? '';
}

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
      const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      setChildren(sorted);
      setSelectedId(pickDefaultChild(sorted, profile.id));
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
      <div className="max-w-lg mx-auto space-y-5 py-6">
        <EmptyState
          title="연결된 자녀가 없어요"
          description="학원 등록 시 적은 학부모 이메일과 로그인 이메일이 같아야 합니다."
        />
        <div className="parent-card p-5 text-sm text-stone-600 space-y-2">
          <p>
            로그인: <strong className="text-stone-900">{profile?.email}</strong>
          </p>
          <p className="text-stone-500">학원에 연결 확인을 요청해 주세요.</p>
        </div>
      </div>
    );
  }

  if (!child) return null;

  const summary = generateLearningSummary(logs, child.name);
  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  const hwHint = homeworkHint(hw.recentRate, logs.length > 0);
  const recentChanges = buildParentRecentChanges(logs);
  const latestScore = scoreTrend.recentAvg;
  const academyName =
    (child as Student & { academies?: { name: string } })?.academies?.name ?? '학원';

  const heroCard = (
    <header className="parent-card overflow-hidden h-full">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 lg:w-[4.5rem] lg:h-[4.5rem] rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700 shrink-0">
              {child.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-600">{academyName}</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
                {child.name}
              </h1>
              <p className="text-sm text-stone-500 mt-1">{child.grade}</p>
            </div>
          </div>
          <p className="text-sm text-stone-600 sm:max-w-xs lg:max-w-sm leading-relaxed sm:text-right">
            <span className="font-medium text-stone-800">{profile?.name ?? '학부모'}</span>님,
            학원에 기록된 학습 정보입니다.
          </p>
        </div>

        {children.length > 1 && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <p className="text-xs font-medium text-stone-500 mb-2">자녀 선택</p>
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-all',
                    c.id === selectedId
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-indigo-200'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 lg:gap-4 mt-6 lg:max-w-xl">
          <PortalStat
            label="최근 점수"
            value={latestScore != null ? `${latestScore}점` : '—'}
            accent="score"
          />
          <PortalStat
            label="숙제"
            value={hwHint.text}
            sub={logs.length > 0 ? `제출률 ${hw.recentRate}%` : undefined}
            accent={hwHint.warn ? 'homework' : 'neutral'}
          />
          <PortalStat
            label="수업 기록"
            value={`${logs.length}회`}
            accent="neutral"
          />
        </div>
      </div>
    </header>
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* 상단: PC에서 가이드 + 프로필 나란히 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-3">
          <ParentPortalGuide />
        </div>
        <div className="lg:col-span-9">{heroCard}</div>
      </div>

      {/* 본문: PC 2열 — 왼쪽 정보 / 오른쪽 AI 채팅 고정 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 lg:space-y-8 min-w-0">
          <PortalSection
            id="overview"
            step="1"
            title="우리 아이, 요즘 어떤가요?"
            description="선생님 메모와 최근 수업을 확인하세요."
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
              <div className="xl:col-span-1 space-y-6">
                <div>
                  <PortalSubheading>한 줄 요약</PortalSubheading>
                  <p className="text-[15px] lg:text-base text-stone-700 leading-relaxed parent-card-soft p-4 lg:p-5">
                    {summary || '수업 기록이 쌓이면 요약이 표시됩니다.'}
                  </p>
                </div>
                {recentChanges.length > 0 && (
                  <div>
                    <PortalSubheading>최근 변화</PortalSubheading>
                    <ul className="space-y-2">
                      {recentChanges.map((line, i) => (
                        <li
                          key={i}
                          className="text-sm text-stone-700 pl-3 border-l-2 border-indigo-200 leading-relaxed"
                        >
                          {line.replace(/\(기록\)/g, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="xl:col-span-1">
                <PortalSubheading>최근 수업</PortalSubheading>
                <ParentRecentLessons logs={logs} />
              </div>
            </div>
          </PortalSection>

          <PortalSection
            id="details"
            step="3"
            title="점수와 일정"
            description="그래프와 이번 주 수업 일정입니다."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <PortalSubheading>점수 그래프</PortalSubheading>
                <ParentScoreChart trend={scoreTrend} />
              </div>
              <div>
                <PortalSubheading>이번 주 일정</PortalSubheading>
                <PortalSchedule classIds={child.class_id ? [child.class_id] : []} />
              </div>
            </div>
          </PortalSection>

          <PortalSection
            id="reports"
            step="4"
            title="원장님 안내문"
            description="학원에서 작성·공유한 기간별 리포트입니다."
          >
            {reportsLoading ? (
              <p className="text-sm text-stone-500">불러오는 중…</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-stone-500 parent-card-soft py-10 text-center">
                아직 안내문이 없습니다.
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={parentReportPath(r.id, 'parent')}
                      className="group block parent-card-soft p-4 lg:p-5 h-full hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-indigo-700">
                          {r.period_start} ~ {r.period_end}
                        </p>
                        <i
                          className="ri-arrow-right-s-line text-stone-400 group-hover:text-indigo-600"
                          aria-hidden
                        />
                      </div>
                      <p className="text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                        {sanitizeParentReportText(r.report_text)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>
        </div>

        <div
          id="ask"
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 scroll-mt-24 min-w-0"
        >
          <p className="text-xs font-semibold text-stone-500 mb-3 hidden lg:flex items-center gap-2">
            <span className="parent-section-badge">2</span>
            궁금하면 오른쪽에서 바로 질문하세요
          </p>
          <ParentAgentChat
            studentId={child.id}
            studentName={child.name}
            academyName={academyName}
            desktopSticky
          />
        </div>
      </div>

      <footer className="text-center text-xs text-stone-400 leading-relaxed pb-2 lg:pb-0">
        문의는 학원으로 연락해 주세요. AI 답변은 참고용이며 최종 안내는 학원에서 드립니다.
      </footer>
    </div>
  );
}
