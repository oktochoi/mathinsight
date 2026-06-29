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
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { ParentAgentChat } from '@/components/portal/ParentAgentChat';
import { ParentRecentLessons } from '@/components/portal/ParentRecentLessons';
import { ParentScoreChart } from '@/components/portal/ParentScoreChart';
import { ParentAttendancePanel } from '@/components/portal/ParentAttendancePanel';
import { ParentHomeworkPanel } from '@/components/portal/ParentHomeworkPanel';
import { ParentGradesPanel } from '@/components/portal/ParentGradesPanel';
import { ParentCounselingPanel } from '@/components/portal/ParentCounselingPanel';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { PortalSection, PortalStat, PortalSubheading } from '@/components/portal/ParentUI';
import { fetchParentLinkedStudents } from '@/lib/portalStudents';
import { buildParentRecentChanges } from '@/lib/learningFlow';
import { usePortalAttendance, usePortalHomework, usePortalExams } from '@/hooks/usePortalErp';
import { usePortalPayments } from '@/hooks/useBilling';
import { usePortalCounselingSessions } from '@/hooks/useCounselingSessions';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { useParentMessagesPortal } from '@/hooks/useParentMessages';
import { ParentPaymentsPanel } from '@/components/portal/ParentPaymentsPanel';
import { ParentNoticesPanel } from '@/components/portal/ParentNoticesPanel';
import { ParentMessagesPanel } from '@/components/portal/ParentMessagesPanel';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import { cn } from '@/lib/cn';

function homeworkHint(rate: number, hasLogs: boolean): { text: string; warn: boolean } {
  if (!hasLogs) return { text: '—', warn: false };
  if (rate >= 85) return { text: '잘 하고 있어요', warn: false };
  if (rate >= 60) return { text: '가끔 빠뜨려요', warn: true };
  return { text: '챙겨 주세요', warn: true };
}

function pickDefaultChild(students: Student[]): string {
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return sorted[0]?.id ?? '';
}

export default function ParentPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { students, error: err } = await fetchParentLinkedStudents(profile.id);

    if (err) setError('자녀 정보를 불러오지 못했습니다.');
    else {
      const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      setChildren(sorted);
      setSelectedId(pickDefaultChild(sorted));
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const child = children.find((c) => c.id === selectedId);
  const { logs } = useLessonLogs({ studentId: selectedId, limit: 30 });
  const { reports, loading: reportsLoading } = useParentReports(selectedId);
  const { summary: attendanceSummary } = usePortalAttendance(selectedId);
  const { assignments, recentHw } = usePortalHomework(selectedId, child?.class_id);
  const { exams: portalExams } = usePortalExams(selectedId);
  const { sessions: counselingSessions } = usePortalCounselingSessions(selectedId);
  const { payments: portalPayments, loading: paymentsLoading } = usePortalPayments(selectedId);
  const { items: notices } = usePortalAnnouncements(selectedId, child?.class_id);
  const { messages: parentMessages, sendMessage } = useParentMessagesPortal(selectedId);
  const { progress: classProgress } = usePortalClassProgress(child?.class_id);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  if (children.length === 0) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-8">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
            <i className="ri-parent-line text-indigo-500 text-2xl" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-stone-900">자녀를 연결해 주세요</h2>
          <p className="text-sm text-stone-500 mt-1">
            학원 코드와 자녀 이름을 입력하면 수업 기록을 볼 수 있습니다.
          </p>
        </div>

        <div className="parent-card p-5 space-y-4">
          <ConnectStudentPanel mode="parent" onSubmitted={load} />
        </div>

        <div className="parent-card p-4 text-xs text-stone-500 space-y-1">
          <p>로그인 계정: <strong className="text-stone-700">{profile?.email}</strong></p>
          <p>코드를 모르시면 자녀가 다니는 학원에 문의해 주세요.</p>
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
            선생님이 기록한 학습 관리 내역입니다.
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            {children.length > 1 && (
              <p className="text-xs font-medium text-stone-500">자녀 선택</p>
            )}
            <button
              type="button"
              onClick={() => setShowAddChild((v) => !v)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <i className="ri-add-line" />
              자녀 추가
            </button>
          </div>
          {showAddChild && (
            <div className="mb-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <p className="text-xs font-semibold text-indigo-800 mb-3">자녀 연결 요청</p>
              <ConnectStudentPanel
                mode="parent"
                onSubmitted={() => { setShowAddChild(false); void load(); }}
              />
            </div>
          )}
          {children.length > 1 && (
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
          )}
        </div>

        {classProgress && (
          <p className="text-xs text-indigo-600 mt-3">
            현재 진도: <strong>{classProgress.unit_name}</strong>
          </p>
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
            title="이번 주 학습 요약"
            description="선생님이 확인한 우리 아이 학습 상태입니다."
          >
            <div className="space-y-6">
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
              <div>
                <PortalSubheading>최근 수업</PortalSubheading>
                <ParentRecentLessons logs={logs} />
              </div>
            </div>
          </PortalSection>

          <PortalSection
            id="homework"
            step="2"
            title="숙제 제출 상태"
            description="제출·미제출 현황을 확인하세요."
          >
            <ParentHomeworkPanel assignments={assignments} recentHw={recentHw} />
          </PortalSection>

          <PortalSection id="attendance" step="3" title="출결" description="출석·지각·결석 기록입니다.">
            <ParentAttendancePanel summary={attendanceSummary} />
          </PortalSection>

          <PortalSection
            id="grades"
            step="4"
            title="최근 성적 변화"
            description="시험 점수와 추세입니다."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParentGradesPanel exams={portalExams} />
              <ParentScoreChart trend={scoreTrend} />
            </div>
          </PortalSection>

          <PortalSection
            id="reports"
            step="5"
            title="상담 리포트"
            description="상담 후 선생님이 전달한 안내문입니다."
          >
            {reportsLoading ? (
              <p className="text-sm text-stone-500">불러오는 중…</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-stone-500 parent-card-soft py-10 text-center">
                아직 상담 리포트가 없습니다.
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
            <div className="mt-4">
              <PortalSubheading>상담 예정</PortalSubheading>
              <ParentCounselingPanel sessions={counselingSessions} />
            </div>
          </PortalSection>

          <PortalSection
            id="notices"
            step="6"
            title="학원 공지"
            description="원장님이 보낸 안내입니다."
          >
            <ParentNoticesPanel items={notices} />
          </PortalSection>

          <PortalSection
            id="payments"
            step="7"
            title="수강료 상태"
            description="청구·납부 현황입니다."
          >
            <ParentPaymentsPanel payments={portalPayments} loading={paymentsLoading} />
          </PortalSection>

          <PortalSection id="schedule" step="8" title="이번 주 일정" description="수업 일정입니다.">
            <PortalSchedule classIds={child.class_id ? [child.class_id] : []} />
          </PortalSection>

          <PortalSection
            id="inquiry"
            step="9"
            title="학부모 문의"
            description="궁금한 점을 학원에 남겨 주세요."
          >
            <ParentMessagesPanel
              messages={parentMessages}
              child={child}
              onSend={async ({ subject, body }) => {
                if (!child.academy_id) return { error: '학원 정보가 없습니다.' };
                return sendMessage({
                  academy_id: child.academy_id,
                  student_id: child.id,
                  subject,
                  body,
                });
              }}
            />
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
