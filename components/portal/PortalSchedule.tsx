'use client';

import { useMemo } from 'react';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import { expandCalendarEvents, getWeekDates, dayLabel } from '@/lib/schedules';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_STYLES,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';
import { cn } from '@/lib/cn';

export function PortalSchedule({ classIds }: { classIds: string[] }) {
  const { schedules, exceptions, loading } = usePortalSchedules(classIds);
  const weekDates = getWeekDates(new Date());
  const events = useMemo(
    () =>
      expandCalendarEvents(schedules, exceptions, weekDates).filter(
        (e) => e.isVisibleToParent
      ),
    [schedules, exceptions, weekDates]
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayList = events.filter((e) => e.date === today);
  const weekList = events
    .filter((e) => e.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    )
    .slice(0, 10);

  if (loading) return <p className="text-sm text-slate-400">일정 불러오는 중…</p>;
  if (classIds.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-white border border-slate-200">
        <h3 className="text-sm font-bold mb-3">이번 주 수업 일정</h3>
        {weekList.length === 0 ? (
          <p className="text-sm text-slate-400">표시할 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {weekList.map((e) => (
              <li
                key={e.id}
                className={cn(
                  'text-sm px-3 py-2 rounded-lg border border-l-4',
                  SCHEDULE_TYPE_STYLES[e.scheduleType as ScheduleType].border,
                  SCHEDULE_TYPE_STYLES[e.scheduleType as ScheduleType].chip
                )}
              >
                <span className="font-medium">
                  {dayLabel(e.dayOfWeek)} {formatTimeRange(e.startTime, e.endTime)}
                </span>{' '}
                <span>{e.className}</span>{' '}
                <span className="text-xs opacity-90">
                  {SCHEDULE_TYPE_LABELS[e.scheduleType as ScheduleType]} ·{' '}
                  {scheduleLocationLabel(e.location)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl p-5 bg-white border">
        <h3 className="text-sm font-bold mb-3">오늘 수업</h3>
        {todayList.length === 0 ? (
          <p className="text-sm text-slate-400">오늘 예정된 수업이 없습니다.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {todayList.map((e) => (
              <li
                key={e.id}
                className={cn(
                  'px-3 py-2 rounded-lg border border-l-4 text-sm',
                  SCHEDULE_TYPE_STYLES[e.scheduleType as ScheduleType].border,
                  SCHEDULE_TYPE_STYLES[e.scheduleType as ScheduleType].chip
                )}
              >
                {formatTimeRange(e.startTime, e.endTime)} · {e.className} ·{' '}
                {SCHEDULE_TYPE_LABELS[e.scheduleType as ScheduleType]} ·{' '}
                {scheduleLocationLabel(e.location)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
