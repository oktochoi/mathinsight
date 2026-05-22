'use client';

import type { CalendarLessonEvent } from '@/types/database';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_STYLES,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import type { ScheduleType } from '@/types/database';
import { cn } from '@/lib/cn';

export function ScheduleTypeLegend({ className }: { className?: string }) {
  const types: ScheduleType[] = ['regular', 'makeup', 'special', 'canceled'];
  return (
    <div className={cn('flex flex-wrap gap-3 text-xs text-slate-600', className)}>
      {types.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', SCHEDULE_TYPE_STYLES[t].dot)} />
          {SCHEDULE_TYPE_STYLES[t].label}
        </span>
      ))}
    </div>
  );
}

export function ScheduleEventChip({
  event,
  selected,
  onSelect,
  variant = 'calendar',
}: {
  event: CalendarLessonEvent;
  selected?: boolean;
  onSelect?: () => void;
  variant?: 'calendar' | 'list';
}) {
  const type = event.scheduleType as ScheduleType;
  const style = SCHEDULE_TYPE_STYLES[type];
  const location = scheduleLocationLabel(event.location);

  if (variant === 'list') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full text-left rounded-lg border border-l-4 px-3 py-2 transition-shadow',
          style.border,
          style.chip,
          selected && 'ring-2 ring-indigo-400 ring-offset-1'
        )}
      >
        <p className="text-sm font-semibold">
          {formatTimeRange(event.startTime, event.endTime)} · {event.className}
        </p>
        <p className="text-xs mt-0.5 opacity-90">
          {SCHEDULE_TYPE_LABELS[type]} · {location}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${event.className} · ${SCHEDULE_TYPE_LABELS[type]} · ${location}`}
      className={cn(
        'w-full text-left rounded-md border border-l-[3px] px-1.5 py-1 cursor-pointer transition-shadow',
        style.border,
        style.chip,
        selected && 'ring-1 ring-indigo-500'
      )}
    >
      <p className="text-[10px] font-semibold leading-tight truncate">
        {event.startTime.slice(0, 5)} {event.className}
      </p>
      <p className="text-[9px] leading-tight truncate opacity-80">
        {SCHEDULE_TYPE_LABELS[type]}
        {event.location?.trim() ? ` · ${event.location.trim()}` : ''}
      </p>
    </button>
  );
}
