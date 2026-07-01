'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStudentPortal } from '@/context/StudentPortalContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { usePortalHomework, usePortalExams } from '@/hooks/usePortalErp';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import { expandCalendarEvents, eventsToday, getWeekDates } from '@/lib/schedules';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentStat } from '@/components/student/StudentUI';
import { cn } from '@/lib/cn';
import type { Student } from '@/types/database';

function StudentHomeContent() {
  const { student } = useStudentPortal();
  if (!student) return null;

  const classIds = student.class_id ? [student.class_id] : [];
  const { schedules, exceptions } = usePortalSchedules(classIds);
  const { logs } = useLessonLogs({ studentId: student.id, limit: 30 });
  const { assignments } = usePortalHomework(student.id, student.class_id);
  const { exams } = usePortalExams(student.id);
  const { items: notices } = usePortalAnnouncements(student.id, student.class_id);
  const { progress: classProgress } = usePortalClassProgress(student.class_id);

  const today = new Date().toISOString().slice(0, 10);
  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  const latestScore = scoreTrend.recentAvg;
  const academyName =
    (student as Student & { academies?: { name: string } }).academies?.name ?? '학원';
  const className =
    (student as Student & { classes?: { name: string } }).classes?.name ?? '반 미지정';

  const weekEvents = useMemo(
    () => expandCalendarEvents(schedules, exceptions, getWeekDates(new Date())),
    [schedules, exceptions]
  );
  const todayLessons = useMemo(() => eventsToday(weekEvents, today), [weekEvents, today]);
  const pendingHw = assignments.filter(
    (a) => !a.submission || a.submission.status !== 'complete'
  ).length;
  const feedbackCount = logs.filter((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0).length;

  const alerts = useMemo(() => {
    const list: { href: string; title: string; sub: string; icon: string }[] = [];
    if (todayLessons.length > 0) {
      list.push({
        href: '/student/schedule',
        title: `오늘 수업 ${todayLessons.length}개`,
        sub: '일정을 확인하세요.',
        icon: 'ri-calendar-line',
      });
    }
    if (pendingHw > 0) {
      list.push({
        href: '/student/homework',
        title: `숙제 ${pendingHw}건`,
        sub: '제출 상태를 확인하세요.',
        icon: 'ri-task-line',
      });
    }
    if (exams.length > 0 && latestScore != null) {
      list.push({
        href: '/student/exams',
        title: `최근 점수 ${latestScore}점`,
        sub: '성적 변화를 확인하세요.',
        icon: 'ri-medal-line',
      });
    }
    if (notices.length > 0) {
      list.push({
        href: '/student/notices',
        title: '학원 공지',
        sub: `${notices.length}건의 안내가 있습니다.`,
        icon: 'ri-megaphone-line',
      });
    }
    if (feedbackCount > 0) {
      list.push({
        href: '/student/history',
        title: `선생님 피드백 ${feedbackCount}건`,
        sub: '수업 기록에서 확인하세요.',
        icon: 'ri-chat-smile-3-line',
      });
    }
    return list;
  }, [todayLessons.length, pendingHw, exams.length, latestScore, notices.length, feedbackCount]);

  return (
    <div className="space-y-6 max-w-lg mx-auto lg:max-w-2xl">
      <header
        className="student-card overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 45%, #0ea5e9 100%)' }}
      >
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold text-sky-100">{academyName}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{student.name}님</h1>
          <p className="text-sm text-sky-100 mt-1">
            {student.grade} · {className}
          </p>
          {classProgress && (
            <p className="text-xs text-sky-50 mt-3">
              지금 배우는 단원: <strong>{classProgress.unit_name}</strong>
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-5 max-w-md">
            <StudentStat label="최근 점수" value={latestScore != null ? `${latestScore}점` : '—'} />
            <StudentStat label="숙제" value={logs.length > 0 ? `${hw.recentRate}%` : '—'} />
            <StudentStat label="수업" value={`${logs.length}건`} />
          </div>
        </div>
      </header>

      <section className="student-card p-5 space-y-3">
        <h2 className="text-base font-bold text-slate-900">오늘 볼 것</h2>
        <p className="text-xs text-slate-500">
          선생님과 대화는 우하단 채팅 아이콘을 이용하세요.
        </p>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-600 student-card-soft p-4 text-center">
            오늘은 특별한 알림이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.href + a.title}>
                <Link
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 hover:border-sky-200"
                >
                  <i className={cn(a.icon, 'text-xl text-sky-600')} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.sub}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function StudentPortalPage() {
  return (
    <StudentPortalGate>{() => <StudentHomeContent />}</StudentPortalGate>
  );
}
