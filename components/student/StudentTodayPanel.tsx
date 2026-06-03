'use client';

import type { CalendarLessonEvent, LessonLog } from '@/types/database';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { formatTimeRange, SCHEDULE_TYPE_LABELS } from '@/lib/scheduleLabels';
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
    <section className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 sm:p-6 shadow-sm shadow-sky-100/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
          <i className="ri-calendar-check-line text-lg" aria-hidden />
        </div>
        <h2 className="text-base font-bold text-sky-950">오늘 & 다가오는 수업</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 border border-sky-100 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            오늘 수업
          </p>
          {todaySchedule ? (
            <>
              <p className="font-semibold text-slate-900">
                {formatTimeRange(todaySchedule.startTime, todaySchedule.endTime)}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {todaySchedule.title} ·{' '}
                {SCHEDULE_TYPE_LABELS[todaySchedule.scheduleType as ScheduleType]}
              </p>
            </>
          ) : todayLog ? (
            <>
              <p className="font-semibold text-slate-900">{todayLog.unit || '수업 기록 있음'}</p>
              <p className="text-sm text-slate-600 mt-1">
                출결 {ATTENDANCE_LABELS[todayLog.attendance_status]} · 숙제{' '}
                {HOMEWORK_LABELS[todayLog.homework_status]}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">오늘 등록된 일정·기록이 없어요</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 border border-sky-100 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            오늘 숙제
          </p>
          <p className="font-semibold text-slate-900 text-lg">
            {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '—'}
          </p>
          {todayLog?.test_score != null && (
            <p className="text-sm text-sky-700 mt-1">오늘 점수 {todayLog.test_score}점</p>
          )}
        </div>

        {nextLesson && (
          <div className="rounded-xl bg-white p-4 border border-sky-100 shadow-sm sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              다음 수업
            </p>
            <p className="font-semibold text-slate-900">
              {nextLesson.date} {nextLesson.startTime.slice(0, 5)} · {nextLesson.title}
            </p>
            {nextLesson.location && (
              <p className="text-sm text-slate-500 mt-1">{nextLesson.location}</p>
            )}
          </div>
        )}

        <div className="rounded-xl bg-white p-4 border border-sky-100 shadow-sm sm:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            선생님 메모
          </p>
          <p className="text-[15px] text-slate-700 leading-relaxed">
            {latestMemoLog?.memo?.trim() ||
              (latestMemoLog?.tags?.length
                ? latestMemoLog.tags.join(', ')
                : '아직 메모가 없어요. 수업이 진행되면 여기에 표시됩니다.')}
          </p>
          {latestMemoLog?.lesson_date && (
            <p className="text-xs text-slate-400 mt-2">
              ({latestMemoLog.lesson_date.slice(0, 10)} 기록)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
