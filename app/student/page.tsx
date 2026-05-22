'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { StudentTodayPanel } from '@/components/student/StudentTodayPanel';
import { eventsToday } from '@/lib/schedules';
import type { Student, LessonLog } from '@/types/database';

export default function StudentPortalPage() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('students')
        .select('*, academies(id, name)')
        .eq('student_user_id', profile.id)
        .maybeSingle();
      if (err) setError('학생 정보를 불러오지 못했습니다.');
      else setStudent(data as Student);
      setLoading(false);
    })();
  }, [profile?.id]);

  const classIds = student?.class_id ? [student.class_id] : [];
  const { schedules, exceptions } = usePortalSchedules(classIds);
  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: student?.id,
    limit: 20,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.lesson_date === today);
  const latestScore = logs.find((l) => l.test_score != null);

  const weekEvents = useMemo(
    () => expandCalendarEvents(schedules, exceptions, getWeekDates(new Date())),
    [schedules, exceptions]
  );
  const todayLessons = useMemo(() => eventsToday(weekEvents, today), [weekEvents, today]);
  const nextLesson = useMemo(() => {
    return weekEvents
      .filter((e) => e.date >= today && e.scheduleType !== 'canceled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] ?? null;
  }, [weekEvents, today]);
  const latestMemoLog = logs.find((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;
  if (!student) {
    return (
      <EmptyState
        title="연결된 학생 프로필이 없습니다"
        description="학원에서 학생 관리에 이 계정(학생) 가입 이메일을 입력·저장해 주세요. 가입 이메일과 동일해야 합니다."
      />
    );
  }

  const feedback = generateLearningSummary(logs, student.name);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">안녕하세요, {student.name}님</h1>
        <p className="text-sm text-slate-500">
          {(student as Student & { academies?: { name: string } }).academies?.name ?? '연결된 학원'} ·{' '}
          {student.grade}
        </p>
      </div>

      <StudentTodayPanel
        todayLog={todayLog}
        latestMemoLog={latestMemoLog}
        nextLesson={nextLesson}
        todayLessons={todayLessons}
      />

      {classIds.length > 0 && <PortalSchedule classIds={classIds} />}

      <div className="rounded-2xl p-5 bg-blue-50 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-900 mb-2">최근 피드백</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          {logs
            .filter((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0)
            .slice(0, 4)
            .map((l) => (
              <li key={l.id} className="leading-relaxed">
                · {l.memo?.trim() || l.tags?.join(', ')}
                <span className="text-blue-600/70 text-xs ml-1">({l.lesson_date.slice(5)})</span>
              </li>
            ))}
          {logs.filter((l) => l.memo?.trim() || l.tags?.length).length === 0 && (
            <li>{feedback}</li>
          )}
        </ul>
      </div>

      <div className="rounded-2xl p-4 bg-white border text-sm flex gap-4">
        <span>
          최근 점수: <strong>{latestScore?.test_score ?? '-'}점</strong>
        </span>
        {todayLog && (
          <span className="text-slate-500">{ATTENDANCE_LABELS[todayLog.attendance_status]}</span>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border">
        <h3 className="text-sm font-bold px-5 py-3 border-b">최근 수업</h3>
        {logsLoading ? (
          <PageLoader />
        ) : logs.length === 0 ? (
          <EmptyState title="기록 없음" />
        ) : (
          <ul className="divide-y text-sm">
            {logs.map((l: LessonLog) => (
              <li key={l.id} className="px-5 py-3 flex justify-between">
                <span>
                  {l.lesson_date} · {l.unit}
                </span>
                <span className="text-slate-500">
                  {HOMEWORK_LABELS[l.homework_status]}
                  {l.test_score != null ? ` · ${l.test_score}점` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
