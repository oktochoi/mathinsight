'use client';

import { useMemo } from 'react';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import { expandCalendarEvents, getWeekDates, dayLabel } from '@/lib/schedules';
import {
  SCHEDULE_TYPE_LABELS,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';
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
    .slice(0, 8);

  if (loading) return <p className="text-sm text-stone-500">일정 불러오는 중…</p>;
  if (classIds.length === 0) {
    return <p className="text-sm text-stone-500">반 정보가 없어 일정을 표시할 수 없습니다.</p>;
  }

  if (weekList.length === 0 && todayList.length === 0) {
    return (
      <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">
        이번 주 표시할 수업 일정이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {todayList.length > 0 && (
        <div>
          <p className="text-xs font-bold text-indigo-600 mb-2">오늘</p>
          <ul className="space-y-2">
            {todayList.map((e) => (
              <li
                key={e.id}
                className="parent-card-soft p-3.5 border-l-4 border-l-indigo-500"
              >
                <p className="font-semibold text-stone-900 text-sm">
                  {formatTimeRange(e.startTime, e.endTime)}
                </p>
                <p className="text-sm text-stone-600 mt-0.5">{e.className}</p>
                <p className="text-xs text-stone-500 mt-1">
                  {SCHEDULE_TYPE_LABELS[e.scheduleType as ScheduleType]} ·{' '}
                  {scheduleLocationLabel(e.location)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {weekList.filter((e) => e.date !== today || todayList.length === 0).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-500 mb-2">다가오는 수업</p>
          <ul className="space-y-2">
            {weekList
              .filter((e) => e.date !== today)
              .map((e) => (
                <li key={e.id} className="parent-card-soft p-3.5 flex flex-wrap gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium text-stone-800 tabular-nums">
                    {e.date.slice(5).replace('-', '/')}
                  </span>
                  <span className="text-stone-400">({dayLabel(e.dayOfWeek)})</span>
                  <span className="text-stone-600">
                    {formatTimeRange(e.startTime, e.endTime)} · {e.className}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
