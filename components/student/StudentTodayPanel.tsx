'use client';

import type { CalendarLessonEvent, LessonLog } from '@/types/database';
import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { formatTimeRange } from '@/lib/scheduleLabels';
import { SCHEDULE_TYPE_LABELS } from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';

export function StudentTodayPanel({
  todayLog,
  latestMemoLog,
  nextLesson,
  todayLessons,
}: {
  todayLog?: LessonLog;
  latestMemoLog?: LessonLog;
  nextLesson: CalendarLessonEvent | null;
  todayLessons: CalendarLessonEvent[];
}) {
  const todaySchedule = todayLessons[0];

  return (
    <section className="rounded-2xl p-5 bg-indigo-50 border border-indigo-100 space-y-4">
      <h2 className="text-sm font-bold text-indigo-950">오늘 해야 할 것</h2>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white p-4 border border-indigo-100">
          <p className="text-xs text-slate-500 mb-1">오늘 수업</p>
          {todaySchedule ? (
            <p className="font-medium text-slate-800">
              {formatTimeRange(todaySchedule.startTime, todaySchedule.endTime)} ·{' '}
              {SCHEDULE_TYPE_LABELS[todaySchedule.scheduleType as ScheduleType]}
            </p>
          ) : todayLog ? (
            <p className="font-medium">{todayLog.unit || '기록 있음'}</p>
          ) : (
            <p className="text-slate-400">일정·기록 없음</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-4 border border-indigo-100">
          <p className="text-xs text-slate-500 mb-1">최근 숙제</p>
          <p className="font-medium">
            {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-indigo-100 sm:col-span-2">
          <p className="text-xs text-slate-500 mb-1">최근 선생님 메모</p>
          <p className="text-slate-700 leading-relaxed">
            {latestMemoLog?.memo?.trim() ||
              (latestMemoLog?.tags?.length
                ? latestMemoLog.tags.join(', ')
                : '아직 메모가 없습니다.')}
          </p>
        </div>
        {nextLesson && (
          <div className="rounded-xl bg-white p-4 border border-indigo-100 sm:col-span-2">
            <p className="text-xs text-slate-500 mb-1">다음 수업</p>
            <p className="font-medium">
              {nextLesson.date} {nextLesson.startTime.slice(0, 5)} · {nextLesson.title}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
