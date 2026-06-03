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
    <div className="student-card overflow-hidden" id="today">
      <div className="px-5 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <i className="ri-calendar-check-line text-sky-600 text-lg" aria-hidden />
          오늘 & 다가오는 수업
        </h2>
      </div>
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="student-card-soft p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">오늘 수업</p>
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

        <div className="student-card-soft p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">오늘 숙제</p>
          <p className="font-semibold text-slate-900 text-lg">
            {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '—'}
          </p>
          {todayLog?.test_score != null && (
            <p className="text-sm text-sky-700 mt-1">오늘 점수 {todayLog.test_score}점</p>
          )}
        </div>

        {nextLesson && (
          <div className="student-card-soft p-4 sm:col-span-2">
            <p className="text-xs font-semibold text-slate-500 mb-2">다음 수업</p>
            <p className="font-semibold text-slate-900">
              {nextLesson.date} {nextLesson.startTime.slice(0, 5)} · {nextLesson.title}
            </p>
            {nextLesson.location && (
              <p className="text-sm text-slate-500 mt-1">{nextLesson.location}</p>
            )}
          </div>
        )}

        {latestMemoLog?.memo?.trim() && (
          <div className="student-card-soft p-4 sm:col-span-2 border-l-4 border-l-sky-400">
            <p className="text-xs font-semibold text-slate-500 mb-2">선생님 한마디</p>
            <p className="text-sm text-slate-700 leading-relaxed">{latestMemoLog.memo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
