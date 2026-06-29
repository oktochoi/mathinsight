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
    return <EmptyState title="수업을 선택해 주세요" description="시간표에서 수업을 누르면 수업 전 확인 화면으로 이동합니다." />;
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/schedule"
        className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--app-ink-3)' }}
      >
        <i className="ri-arrow-left-line" />시간표
      </Link>

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}>
          {cls?.name ?? '반'} · 수업 전 확인
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>{date}</p>
      </div>

      {todayLessonItem && (
        <FlowBadgeRow badges={getLessonFlowState(todayLessonItem, date).badges} />
      )}

      <div className="app-card p-5 space-y-3 text-sm">
        {prep?.recentUnit && (
          <p>
            <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>지난 수업 단원:</span>{' '}
            <span style={{ color: 'var(--app-ink-2)' }}>{prep.recentUnit}</span>
          </p>
        )}
        {prep?.lastClassMemo && (
          <p>
            <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>지난 수업 메모:</span>{' '}
            <span style={{ color: 'var(--app-ink-2)' }}>
              {prep.lastClassMemo}
              {prep.lastClassDate ? ` (${prep.lastClassDate})` : ''}
            </span>
          </p>
        )}
      </div>

      <div className="app-card p-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--app-ink)' }}>학생별 확인</h2>
        {!prep || prep.studentNotes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--app-ink-4)' }}>이 반에 등록된 학생이 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {prep.studentNotes.map(({ student, missingCount, attentionReason, followupTitles, lastMemo }) => {
              const hasNote =
                missingCount > 0 || attentionReason || followupTitles.length > 0;
              if (!hasNote && !lastMemo) return null;
              return (
                <li key={student.id} className="pb-3 last:border-0" style={{ borderBottom: '1px solid var(--app-border)' }}>
                  <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>{student.name}</p>
                  <ul className="text-xs mt-1 space-y-0.5 list-disc pl-4" style={{ color: 'var(--app-ink-2)' }}>
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
                    className="text-[10px] mt-1 inline-block hover:underline"
                    style={{ color: 'var(--app-accent)' }}
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
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>특별히 표시할 기록 패턴이 없습니다.</p>
        )}
      </div>

      <Link
        href={`/lesson-logs?class=${classId}`}
        className="block text-center app-btn app-btn-primary w-full justify-center"
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
