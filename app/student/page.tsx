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
import { StudentSection, StudentStat, StudentSubheading } from '@/components/student/StudentUI';
import {
  buildStudentProgressLines,
  buildStudentStudyTips,
} from '@/lib/studentPortalInsights';
import type { Student } from '@/types/database';

export default function StudentPortalPage() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { student: row, error: err } = await fetchStudentSelfProfile(profile.id);
    if (err) setError('학생 정보를 불러오지 못했습니다.');
    else setStudent(row);
    setLoading(false);
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
      <div className="max-w-lg mx-auto space-y-5 py-6">
        <EmptyState
          title="연결된 학생 프로필이 없어요"
          description="학원 등록 시 적은 학생 이메일과 로그인 이메일이 같아야 합니다."
        />
        <div className="student-card p-5 text-sm text-slate-600">
          로그인: <strong className="text-slate-900">{profile?.email}</strong>
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
            id="feedback"
            step="3"
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
            step="4"
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
