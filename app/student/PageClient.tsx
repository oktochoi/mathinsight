'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentSelfProfile } from '@/lib/portalStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import { generateLearningSummary } from '@/lib/reportGenerator';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRecentUnits,
} from '@/lib/analytics';
import { expandCalendarEvents, getWeekDates, eventsToday } from '@/lib/schedules';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { StudentLessonHistory } from '@/components/portal/StudentLessonHistory';
import { StudentTodayPanel } from '@/components/student/StudentTodayPanel';
import { StudentPortalGuide } from '@/components/student/StudentPortalGuide';
import { StudentStudyTips } from '@/components/student/StudentStudyTips';
import { StudentCharts } from '@/components/student/StudentCharts';
import { StudentHomeworkPanel } from '@/components/student/StudentHomeworkPanel';
import { StudentExamsPanel } from '@/components/student/StudentExamsPanel';
import { StudentSection, StudentStat, StudentSubheading } from '@/components/student/StudentUI';
import { usePortalHomework, usePortalExams } from '@/hooks/usePortalErp';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import { ParentNoticesPanel } from '@/components/portal/ParentNoticesPanel';
import { ParentAgentChat } from '@/components/portal/ParentAgentChat';
import {
  buildStudentProgressLines,
  buildStudentStudyTips,
} from '@/lib/studentPortalInsights';
import type { Student } from '@/types/database';
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { StudentChatSection } from '@/components/chat/StudentChatSection';
import { formatPhoneDisplay } from '@/lib/phone';

export default function StudentPortalPage() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    const { student: row, error: err } = await fetchStudentSelfProfile(profile.id);
    if (err) setError('학생 정보를 불러오지 못했습니다.');
    else setStudent(row);
    setLoading(false);
    return row;
  }, [profile?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const classIds = student?.class_id ? [student.class_id] : [];
  const { schedules, exceptions } = usePortalSchedules(classIds);
  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: student?.id,
    limit: 30,
  });
  const { assignments, recentHw } = usePortalHomework(student?.id, student?.class_id);
  const { exams: portalExams } = usePortalExams(student?.id);
  const { items: notices } = usePortalAnnouncements(student?.id, student?.class_id);
  const { progress: classProgress } = usePortalClassProgress(student?.class_id);

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.lesson_date === today);
  const latestMemoLog = logs.find((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0);

  const weekEvents = useMemo(
    () => expandCalendarEvents(schedules, exceptions, getWeekDates(new Date())),
    [schedules, exceptions]
  );
  const todayLessons = useMemo(() => eventsToday(weekEvents, today), [weekEvents, today]);
  const nextLesson = useMemo(() => {
    return (
      weekEvents
        .filter((e) => e.date >= today && e.scheduleType !== 'canceled')
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
        )[0] ?? null
    );
  }, [weekEvents, today]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;
  if (!student) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-8">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3">
            <i className="ri-graduation-cap-line text-sky-500 text-2xl" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-slate-900">학원을 연결해 주세요</h2>
          <p className="text-sm text-slate-500 mt-1">
            학원 코드를 입력하고 본인 정보를 확인하면 바로 이용할 수 있습니다.
          </p>
        </div>

        <div className="student-card p-5 space-y-4">
          <ConnectStudentPanel
            mode="student"
            onSubmitted={async () => {
              const row = await load();
              if (!row) setError('연결은 완료되었지만 정보를 불러오지 못했습니다. 새로고침해 주세요.');
            }}
          />
        </div>

        <div className="student-card p-4 text-xs text-slate-500 space-y-1">
          <p>
            로그인 아이디:{' '}
            <strong className="text-slate-700">
              {profile?.phone ? formatPhoneDisplay(profile.phone) : profile?.email}
            </strong>
          </p>
          <p>코드를 모르시면 학원 선생님께 문의해 주세요.</p>
        </div>
      </div>
    );
  }

  const academyName =
    (student as Student & { academies?: { name: string } }).academies?.name ?? '학원';
  const className =
    (student as Student & { classes?: { name: string } }).classes?.name ?? '반 미지정';
  const summary = generateLearningSummary(logs, student.name);
  const scoreTrend = calculateScoreTrend(logs);
  const scoreChart = scoreTrend.points;
  const hw = calculateHomeworkTrend(logs);
  const hwChart = hw.weeklyRates.filter((w) => w.rate > 0 || logs.length > 0);
  const recentUnits = getRecentUnits(logs, 5);
  const progressLines = buildStudentProgressLines(logs);
  const studyTips = buildStudentStudyTips(logs);
  const latestScore = scoreChart.length > 0 ? scoreChart[scoreChart.length - 1].score : null;
  const feedbackLogs = logs.filter((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0);

  const heroCard = (
    <header
      className="student-card overflow-hidden h-full"
      style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 45%, #0ea5e9 100%)',
      }}
    >
      <div className="p-5 sm:p-6 lg:p-7">
        <p className="text-xs font-semibold text-sky-100 tracking-wide">{academyName}</p>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1 tracking-tight">
          안녕하세요, {student.name}님
        </h1>
        <p className="text-sm text-sky-100 mt-1">
          {student.grade} · {className}
        </p>
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mt-6 lg:max-w-md">
          <StudentStat
            label="최근 점수"
            value={latestScore != null ? `${latestScore}점` : '—'}
          />
          <StudentStat
            label="숙제 제출"
            value={logs.length > 0 ? `${hw.recentRate}%` : '—'}
          />
          <StudentStat label="수업 기록" value={`${logs.length}건`} />
        </div>
      </div>
    </header>
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-3">
          <StudentPortalGuide />
        </div>
        <div className="lg:col-span-9">{heroCard}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 xl:col-span-8 space-y-6 lg:space-y-8 min-w-0">
          <StudentSection
            id="ai-chat"
            step="0"
            title="AI 학습 상담"
            description="오늘 배운 내용이 궁금하면 바로 질문해 보세요."
          >
            <ParentAgentChat
              studentId={student.id}
              studentName={student.name}
              academyName={academyName}
            />
          </StudentSection>

          <StudentSection
            id="learn"
            step="1"
            title="내 학습 흐름"
            description="요약·점수·숙제를 한곳에서 확인하세요."
          >
            <StudentSubheading>학습 요약</StudentSubheading>
            <p className="text-[15px] lg:text-base text-slate-700 leading-relaxed student-card-soft p-4 lg:p-5">
              {summary}
            </p>
            {recentUnits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recentUnits.map((u) => (
                  <span
                    key={u}
                    className="text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200"
                  >
                    {u}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8">
              <StudentCharts
                scoreTrend={scoreTrend}
                scoreChart={scoreChart}
                hwChart={hwChart}
              />
            </div>

            <div className="mt-8">
              <StudentSubheading>최근 변화</StudentSubheading>
              <ul className="space-y-2">
                {progressLines.map((line, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-3 border-l-2 border-sky-300 leading-relaxed"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </StudentSection>

          {classIds.length > 0 && (
            <StudentSection
              id="schedule"
              step="2"
              title="이번 주 수업 일정"
              description="시간표에 등록된 수업입니다."
            >
              <PortalSchedule classIds={classIds} />
            </StudentSection>
          )}

          <StudentSection
            id="homework"
            step="3"
            title="이번 주 숙제"
            description="마감일과 제출 상태를 확인하세요."
          >
            <StudentHomeworkPanel assignments={assignments} recentHw={recentHw} />
          </StudentSection>

          <StudentSection
            id="exams"
            step="4"
            title="시험·점수"
            description="최근 시험 결과입니다."
          >
            <StudentExamsPanel exams={portalExams} />
          </StudentSection>

          {notices.length > 0 && (
            <StudentSection
              id="notices"
              step="5"
              title="학원 공지"
              description="선생님이 올린 안내입니다."
            >
              <ParentNoticesPanel items={notices} />
            </StudentSection>
          )}

          {classProgress && (
            <p className="text-sm text-sky-700 student-card-soft px-4 py-3">
              지금 배우는 단원: <strong>{classProgress.unit_name}</strong>
            </p>
          )}

          <StudentSection
            id="chat"
            step="6"
            title="선생님 · 반 톡방"
            description="담당 선생님과 1:1, 반 단톡으로 메시지를 보낼 수 있습니다."
          >
            <StudentChatSection student={student} />
          </StudentSection>

          <StudentSection
            id="feedback"
            step="7"
            title="선생님 피드백"
            description="수업 메모·태그가 있을 때 표시됩니다."
          >
            <ul className="divide-y divide-sky-50">
              {feedbackLogs.length === 0 ? (
                <li className="py-6 text-sm text-slate-500 text-center">{summary}</li>
              ) : (
                feedbackLogs.slice(0, 8).map((l) => (
                  <li key={l.id} className="py-4 first:pt-0">
                    <p className="text-xs text-slate-500 tabular-nums">{l.lesson_date}</p>
                    <p className="text-[15px] text-slate-800 mt-1 leading-relaxed">
                      {l.memo?.trim() || l.tags?.join(', ')}
                    </p>
                    {l.tags?.length && l.memo?.trim() ? (
                      <p className="text-xs text-sky-700 mt-1.5">태그: {l.tags.join(', ')}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </StudentSection>

          <StudentSection
            id="history"
            step="8"
            title="수업 기록 전체"
            description={`최근 ${logs.length}건`}
          >
            {logsLoading ? (
              <PageLoader />
            ) : (
              <StudentLessonHistory logs={logs} />
            )}
          </StudentSection>
        </div>

        <div className="lg:col-span-4 xl:col-span-4 space-y-5 lg:sticky lg:top-6 scroll-mt-24">
          <StudentTodayPanel
            todayLog={todayLog}
            latestMemoLog={latestMemoLog}
            nextLesson={nextLesson}
            todayLessons={todayLessons}
          />
          <StudentStudyTips tips={studyTips} />
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 pb-2">
        궁금한 점은 학원 선생님께 물어보세요. 이 화면은 학원 기록을 보여 줍니다.
      </footer>
    </div>
  );
}
