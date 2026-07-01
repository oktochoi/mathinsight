'use client';

import { useMemo, useState } from 'react';
import { usePortalSchedules } from '@/hooks/useClassSchedules';
import {
  expandCalendarEvents,
  getMonthGridDates,
  getDatesBetween,
  eventsForDate,
} from '@/lib/schedules';
import { getKrPublicHolidayMap } from '@/lib/krPublicHolidays';
import { ScheduleEventChip, ScheduleTypeLegend } from '@/components/schedules/ScheduleEventChip';
import {
  SCHEDULE_TYPE_LABELS,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import type { CalendarLessonEvent, ScheduleType } from '@/types/database';
import { cn } from '@/lib/cn';

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

export function PortalSchedule({ classIds }: { classIds: string[] }) {
  const { schedules, exceptions, loading } = usePortalSchedules(classIds);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = useMemo(() => getMonthGridDates(year, month), [year, month]);
  const gridDates = useMemo(() => grid.map((c) => c.date), [grid]);

  const monthEvents = useMemo(() => {
    if (gridDates.length === 0) return [];
    const start = gridDates[0];
    const end = gridDates[gridDates.length - 1];
    const allDates = getDatesBetween(start, end);
    return expandCalendarEvents(schedules, exceptions, allDates).filter(
      (e) => e.isVisibleToParent && e.scheduleType !== 'canceled'
    );
  }, [schedules, exceptions, gridDates]);

  const holidayMap = useMemo(() => getKrPublicHolidayMap(gridDates), [gridDates]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarLessonEvent[]>();
    for (const d of gridDates) {
      map.set(d, eventsForDate(monthEvents, d));
    }
    return map;
  }, [monthEvents, gridDates]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const selectedHoliday = holidayMap.get(selectedDate);

  const shiftMonth = (delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  if (loading) return <p className="text-sm text-stone-500">일정 불러오는 중…</p>;
  if (classIds.length === 0) {
    return <p className="text-sm text-stone-500">반 정보가 없어 일정을 표시할 수 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50"
          aria-label="이전 달"
        >
          <i className="ri-arrow-left-s-line text-xl" />
        </button>
        <h2 className="text-base font-bold text-stone-900 tabular-nums">
          {year}년 {MONTH_NAMES[month]}
        </h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50"
          aria-label="다음 달"
        >
          <i className="ri-arrow-right-s-line text-xl" />
        </button>
      </div>

      <div className="parent-card overflow-hidden p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-px mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((label, i) => (
            <div
              key={label}
              className={cn(
                'text-center text-[10px] font-bold py-1',
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-600' : 'text-stone-500'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            const dayEvents = eventsByDate.get(cell.date) ?? [];
            const holiday = holidayMap.get(cell.date);
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const dayNum = Number(cell.date.slice(8, 10));
            const dow = new Date(cell.date + 'T12:00:00').getDay();
            const hasMakeup = dayEvents.some((e) => e.scheduleType === 'makeup');

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={cn(
                  'min-h-[52px] sm:min-h-[64px] rounded-lg p-1 text-left transition-colors border',
                  !cell.inMonth && 'opacity-40',
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-transparent hover:bg-stone-50',
                  hasMakeup && !isSelected && 'bg-amber-50/80'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-semibold tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-full',
                    isToday && 'bg-indigo-600 text-white',
                    !isToday && dow === 0 && 'text-red-500',
                    !isToday && dow === 6 && 'text-blue-600',
                    !isToday && dow !== 0 && dow !== 6 && 'text-stone-800'
                  )}
                >
                  {dayNum}
                </span>
                {holiday && (
                  <p className="text-[8px] sm:text-[9px] text-red-600 font-medium truncate leading-tight mt-0.5">
                    {holiday}
                  </p>
                )}
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        e.scheduleType === 'makeup'
                          ? 'bg-amber-500'
                          : e.scheduleType === 'special'
                            ? 'bg-violet-500'
                            : 'bg-indigo-500'
                      )}
                      title={SCHEDULE_TYPE_LABELS[e.scheduleType as ScheduleType]}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] text-stone-400">+{dayEvents.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ScheduleTypeLegend className="px-1" />

      <div className="parent-card-soft p-4 space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm font-bold text-stone-900 tabular-nums">
            {selectedDate.replace(/-/g, '.')}
          </p>
          {selectedHoliday && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {selectedHoliday}
            </span>
          )}
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-stone-500">
            {selectedHoliday
              ? '공휴일이라 정규 수업이 없을 수 있습니다.'
              : '이 날 표시할 수업 일정이 없습니다.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <ScheduleEventChip event={e} variant="list" />
              </li>
            ))}
          </ul>
        )}

        {selectedEvents.some((e) => e.scheduleType === 'makeup') && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            보강 수업이 포함된 날입니다. 시간·장소를 꼭 확인해 주세요.
          </p>
        )}
      </div>

      {selectedEvents.length > 0 && (
        <div className="text-xs text-stone-500 space-y-1 px-1">
          {selectedEvents.map((e) => (
            <p key={`detail-${e.id}`}>
              {formatTimeRange(e.startTime, e.endTime)} · {e.className} ·{' '}
              {SCHEDULE_TYPE_LABELS[e.scheduleType as ScheduleType]} ·{' '}
              {scheduleLocationLabel(e.location)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
