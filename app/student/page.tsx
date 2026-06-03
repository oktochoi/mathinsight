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
import {
  buildStudentProgressLines,
  buildStudentStudyTips,
} from '@/lib/studentPortalInsights';
import type { Student } from '@/types/database';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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
      <div className="space-y-6 flex flex-col items-center max-w-lg mx-auto py-8">
        <EmptyState
          title="연결된 학생 프로필이 없습니다"
          description="학원에서 학생 등록 시 입력한 학생 이메일과 동일한 계정으로 가입·로그인해야 합니다."
        />
        <p className="text-sm text-slate-600 max-w-md text-center leading-relaxed">
          로그인 이메일: <strong className="text-slate-900">{profile?.email}</strong>
        </p>
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

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-8 pb-10">
      <header
        className="rounded-2xl p-5 sm:p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)' }}
      >
        <p className="text-xs font-medium text-sky-100 uppercase tracking-wide">{academyName}</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">안녕하세요, {student.name}님</h1>
        <p className="text-sm text-sky-100/95 mt-1">
          {student.grade} · {className}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-medium text-sky-100 uppercase">최근 점수</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">
              {latestScore != null ? `${latestScore}점` : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-medium text-sky-100 uppercase">숙제 제출</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">
              {logs.length > 0 ? `${hw.recentRate}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-medium text-sky-100 uppercase">수업 기록</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">{logs.length}건</p>
          </div>
        </div>
      </header>

      <StudentTodayPanel
        todayLog={todayLog}
        latestMemoLog={latestMemoLog}
        nextLesson={nextLesson}
        todayLessons={todayLessons}
      />

      <section className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 sm:p-6">
        <h2 className="text-sm font-bold text-sky-950 flex items-center gap-2 mb-3">
          <i className="ri-lightbulb-line text-sky-600" aria-hidden />
          오늘의 학습 포인트
        </h2>
        <ul className="space-y-2.5">
          {studyTips.map((tip, i) => (
            <li
              key={i}
              className="text-[15px] text-sky-950 leading-relaxed flex gap-2 bg-white/80 rounded-xl px-4 py-3 border border-sky-100"
            >
              <span className="text-sky-500 font-bold shrink-0">{i + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <i className="ri-line-chart-line text-sky-600" aria-hidden />
          내 학습 흐름
        </h2>

        <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">학습 요약</h3>
          <p className="text-[15px] text-slate-700 leading-relaxed">{summary}</p>
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
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">점수 추이</h3>
            {scoreChart.length === 0 ? (
              <p className="text-sm text-slate-500">점수 기록이 없어요.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={scoreChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0284c7"
                    fill="#0284c7"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {scoreTrend.direction === 'up' && scoreTrend.delta != null && (
              <p className="text-xs text-emerald-700 mt-2">최근 점수가 올라가는 흐름이에요.</p>
            )}
            {scoreTrend.direction === 'down' && scoreTrend.delta != null && (
              <p className="text-xs text-amber-800 mt-2">
                최근 점수가 조금 내려갔어요. 복습해 볼까요?
              </p>
            )}
          </div>

          <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">숙제 제출 (주별)</h3>
            {hwChart.length === 0 || hwChart.every((w) => w.rate === 0) ? (
              <p className="text-sm text-slate-500">숙제 기록이 아직 없어요.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hwChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#0369a1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">최근 변화</h3>
          <ul className="text-sm text-slate-700 space-y-2 leading-relaxed">
            {progressLines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-sky-500 shrink-0">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {classIds.length > 0 && (
        <section className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">이번 주 수업 일정</h3>
          <PortalSchedule classIds={classIds} />
        </section>
      )}

      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-sky-50/50">
          <h3 className="text-sm font-bold text-sky-950">선생님 피드백</h3>
          <p className="text-xs text-slate-500 mt-1">수업 메모·태그가 있을 때 표시됩니다</p>
        </div>
        <ul className="divide-y divide-slate-100 px-5 py-2">
          {feedbackLogs.length === 0 ? (
            <li className="py-6 text-sm text-slate-500 leading-relaxed">{summary}</li>
          ) : (
            feedbackLogs.slice(0, 6).map((l) => (
              <li key={l.id} className="py-4">
                <p className="text-xs text-slate-500">{l.lesson_date}</p>
                <p className="text-[15px] text-slate-800 mt-1 leading-relaxed">
                  {l.memo?.trim() || l.tags?.join(', ')}
                </p>
                {l.tags?.length && l.memo?.trim() ? (
                  <p className="text-xs text-sky-700 mt-1">태그: {l.tags.join(', ')}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">수업 기록 전체</h3>
          <span className="text-xs text-slate-500">{logs.length}건</span>
        </div>
        {logsLoading ? (
          <div className="p-6">
            <PageLoader />
          </div>
        ) : (
          <StudentLessonHistory logs={logs} />
        )}
      </section>
    </div>
  );
}
