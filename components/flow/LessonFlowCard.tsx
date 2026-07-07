'use client';

import Link from 'next/link';
import type { TodayLessonItem } from '@/types/database';
import { getLessonFlowState } from '@/lib/learningFlow';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_STYLES,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';
import { FlowBadgeRow } from '@/components/flow/FlowBadgeRow';
import { cn } from '@/lib/cn';

export function LessonFlowCard({
  item,
  date,
  compact = false,
}: {
  item: TodayLessonItem;
  date?: string;
  compact?: boolean;
}) {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const state = getLessonFlowState(item, d);
  const { event } = item;
  const typeStyle = SCHEDULE_TYPE_STYLES[event.scheduleType as ScheduleType];

  return (
    <li
      className={cn(
        'rounded-xl border border-l-4 px-4 py-3 flex flex-wrap items-center gap-3 transition-shadow',
        typeStyle.border,
        state.timing === 'starting_soon' &&
          'border-amber-300 bg-amber-50/80 shadow-md shadow-amber-100/80 ring-1 ring-amber-200',
        state.timing === 'ended' && state.emphasizeRecord && 'border-orange-200 bg-orange-50/50',
        state.timing === 'canceled' && 'opacity-60 bg-slate-50',
        !['starting_soon', 'ended', 'canceled'].includes(state.timing) && typeStyle.chip
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-semibold text-sm', compact && 'text-xs')}>
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
          {state.timing === 'starting_soon' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
              곧 시작
            </span>
          )}
          {state.timing === 'ended' && state.emphasizeRecord && (
            <span className="text-[10px] font-semibold text-orange-700">수업 종료</span>
          )}
        </div>
        <p className={cn('text-slate-800 mt-0.5', compact ? 'text-xs' : 'text-sm')}>
          {event.className}{' '}
          <span
            className={cn(
              'font-normal text-[10px] px-1.5 py-0.5 rounded-full border',
              typeStyle.chip
            )}
          >
            {SCHEDULE_TYPE_LABELS[event.scheduleType as ScheduleType]}
          </span>
        </p>
        <p className={cn('text-slate-500 mt-0.5 flex items-center gap-1', compact ? 'text-[10px]' : 'text-xs')}>
          <i className="ri-map-pin-line shrink-0" />
          {scheduleLocationLabel(event.location)}
        </p>
        <div className="mt-2">
          <FlowBadgeRow badges={state.badges} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        {state.emphasizeRecord ? (
          <Link
            href={`/lesson-logs?class=${event.classId}`}
            className="text-xs px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold text-center cursor-pointer"
          >
            오늘 수업 기록 입력
          </Link>
        ) : (
          <Link
            href={`/schedule?classId=${event.classId}&date=${event.date}`}
            className="text-xs px-3 py-2 rounded-lg bg-indigo-600 text-white text-center cursor-pointer"
          >
            수업 준비
          </Link>
        )}
        {!compact && (
          <Link
            href={`/schedule?`}
            className="text-xs px-3 py-2 rounded-lg border text-center cursor-pointer"
          >
            상세
          </Link>
        )}
      </div>
    </li>
  );
}
