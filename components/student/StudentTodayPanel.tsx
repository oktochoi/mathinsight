'use client';

import Link from 'next/link';
import type { CalendarLessonEvent, LessonLog } from '@/types/database';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { formatTimeRange, SCHEDULE_TYPE_LABELS } from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';
import { cn } from '@/lib/cn';

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
  const attended =
    todayLog?.attendance_status === 'present' || todayLog?.attendance_status === 'late';
  const hwStatus = todayLog?.homework_status;
  const hwSubmitted = hwStatus === 'complete' || hwStatus === 'partial';

  return (
    <div className="space-y-4">
      <div className="student-card overflow-hidden" id="daily-check">
        <div className="px-5 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--app-ink)' }}>
            <i className="ri-checkbox-circle-line text-sky-600 text-lg" aria-hidden />
            오늘의 학습 체크
          </h2>
        </div>
        <ul className="p-4 space-y-3">
          <li className="flex items-center justify-between gap-3 text-sm">
            <span style={{ color: 'var(--app-ink-2)' }}>오늘 수업 출석</span>
            <span
              className={cn(
                'font-semibold',
                attended ? 'text-emerald-700' : todayLog ? 'text-amber-700' : 'text-stone-400'
              )}
            >
              {todayLog
                ? ATTENDANCE_LABELS[todayLog.attendance_status]
                : todaySchedule
                  ? '수업 예정'
                  : '기록 없음'}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span style={{ color: 'var(--app-ink-2)' }}>숙제 제출</span>
            <span
              className={cn(
                'font-semibold',
                hwSubmitted ? 'text-emerald-700' : todayLog ? 'text-amber-700' : 'text-stone-400'
              )}
            >
              {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '—'}
            </span>
          </li>
        </ul>
        <div className="px-4 pb-4">
          <Link
            href="#ai-chat"
            className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
          >
            AI에게 오늘 배운 것 질문하기
            <i className="ri-arrow-right-line" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="student-card overflow-hidden" id="today">
        <div
          className="px-5 py-4 border-b border-sky-100"
          style={{ background: 'linear-gradient(to right, var(--app-accent-bg), var(--app-surface))' }}
        >
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--app-ink)' }}>
            <i className="ri-calendar-check-line text-sky-600 text-lg" aria-hidden />
            오늘 & 다가오는 수업
          </h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="student-card-soft p-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>
              오늘 수업
            </p>
            {todaySchedule ? (
              <>
                <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {formatTimeRange(todaySchedule.startTime, todaySchedule.endTime)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--app-ink-2)' }}>
                  {todaySchedule.title} ·{' '}
                  {SCHEDULE_TYPE_LABELS[todaySchedule.scheduleType as ScheduleType]}
                </p>
              </>
            ) : todayLog ? (
              <>
                <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {todayLog.unit || '수업 기록 있음'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--app-ink-2)' }}>
                  출결 {ATTENDANCE_LABELS[todayLog.attendance_status]} · 숙제{' '}
                  {HOMEWORK_LABELS[todayLog.homework_status]}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
                오늘 등록된 일정·기록이 없어요
              </p>
            )}
          </div>

          <div className="student-card-soft p-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>
              오늘 숙제
            </p>
            <p className="font-semibold text-lg" style={{ color: 'var(--app-ink)' }}>
              {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '—'}
            </p>
            {todayLog?.test_score != null && (
              <p className="text-sm text-sky-700 mt-1">오늘 점수 {todayLog.test_score}점</p>
            )}
          </div>

          {nextLesson && (
            <div className="student-card-soft p-4 sm:col-span-2">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>
                다음 수업
              </p>
              <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                {nextLesson.date} {nextLesson.startTime.slice(0, 5)} · {nextLesson.title}
              </p>
              {nextLesson.location && (
                <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
                  {nextLesson.location}
                </p>
              )}
            </div>
          )}

          {latestMemoLog?.memo?.trim() && (
            <div className="student-card-soft p-4 sm:col-span-2 border-l-4 border-l-sky-400">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>
                선생님 한마디
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                {latestMemoLog.memo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
