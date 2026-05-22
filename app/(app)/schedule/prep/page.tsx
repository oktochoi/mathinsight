'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useClasses } from '@/hooks/useClasses';
import { getClassPrepData } from '@/lib/classInsights';
import { FlowBadgeRow } from '@/components/flow/FlowBadgeRow';
import { getLessonFlowState } from '@/lib/learningFlow';
import { buildTodayLessons } from '@/lib/classInsights';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import { useClassSchedules } from '@/hooks/useClassSchedules';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';

function PrepContent() {
  const params = useSearchParams();
  const classId = params.get('classId') ?? '';
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10);

  const { classes } = useClasses();
  const { students } = useStudents();
  const { logs, loading } = useLessonLogs({ limit: 500 });
  const { followups } = useConsultationFollowups();
  const { schedules, exceptions } = useClassSchedules();

  const cls = classes.find((c) => c.id === classId);
  const prep = classId ? getClassPrepData(classId, students, logs, followups) : null;

  const todayLessonItem = useMemo(() => {
    if (!classId) return null;
    const events = expandCalendarEvents(schedules, exceptions, getWeekDates(new Date()));
    const items = buildTodayLessons(events, students, logs, followups, date);
    return items.find((i) => i.event.classId === classId) ?? null;
  }, [classId, schedules, exceptions, students, logs, followups, date]);

  if (!classId) {
    return <EmptyState title="반 정보가 없습니다" description="시간표에서 수업 준비를 선택해 주세요." />;
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/schedule" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
        <i className="ri-arrow-left-line"></i>시간표
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {cls?.name ?? '반'} · 수업 전 확인
        </h1>
        <p className="text-sm text-slate-500 mt-1">{date}</p>
      </div>

      {todayLessonItem && (
        <FlowBadgeRow badges={getLessonFlowState(todayLessonItem, date).badges} />
      )}

      <div className="rounded-2xl p-5 bg-white border space-y-3 text-sm">
        {prep?.recentUnit && (
          <p>
            <span className="font-semibold text-slate-800">지난 수업 단원:</span>{' '}
            {prep.recentUnit}
          </p>
        )}
        {prep?.lastClassMemo && (
          <p>
            <span className="font-semibold text-slate-800">지난 수업 메모:</span>{' '}
            {prep.lastClassMemo}
            {prep.lastClassDate ? ` (${prep.lastClassDate})` : ''}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-5 bg-white border">
        <h2 className="text-sm font-bold mb-4">학생별 확인</h2>
        {!prep || prep.studentNotes.length === 0 ? (
          <p className="text-sm text-slate-400">이 반에 등록된 학생이 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {prep.studentNotes.map(({ student, missingCount, attentionReason, followupTitles, lastMemo }) => {
              const hasNote =
                missingCount > 0 || attentionReason || followupTitles.length > 0;
              if (!hasNote && !lastMemo) return null;
              return (
                <li key={student.id} className="border-b border-slate-50 pb-3 last:border-0">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <ul className="text-xs text-slate-600 mt-1 space-y-0.5 list-disc pl-4">
                    {missingCount > 0 && (
                      <li>최근 숙제 미제출 기록이 {missingCount}회 있습니다.</li>
                    )}
                    {attentionReason && <li>{attentionReason}</li>}
                    {followupTitles.map((t) => (
                      <li key={t}>지난 상담 이후 확인: {t}</li>
                    ))}
                    {lastMemo && <li>메모: {lastMemo}</li>}
                  </ul>
                  <Link
                    href={`/students/${student.id}`}
                    className="text-[10px] text-indigo-600 mt-1 inline-block"
                  >
                    학생 상세 →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {prep?.studentNotes.every(
          (n) =>
            n.missingCount === 0 &&
            !n.attentionReason &&
            n.followupTitles.length === 0 &&
            !n.lastMemo
        ) && (
          <p className="text-sm text-slate-500">특별히 표시할 기록 패턴이 없습니다.</p>
        )}
      </div>

      <Link
        href={`/lesson-logs?class=${classId}`}
        className="block text-center py-3 rounded-xl bg-slate-800 text-white text-sm font-semibold"
      >
        오늘 기록 입력하기
      </Link>
    </div>
  );
}

export default function SchedulePrepPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PrepContent />
    </Suspense>
  );
}
