'use client';

import { formatTimeRange } from '@/lib/scheduleLabels';
import type { CalendarTimeSlot } from '@/lib/growthPipeline';
import type { ScheduleType } from '@/types/database';
import { cn } from '@/lib/cn';

const LESSON_COLORS: Record<ScheduleType, { bg: string; border: string; text: string }> = {
  regular: { bg: 'var(--event-regular-bg)', border: 'var(--event-regular-border)', text: 'var(--event-regular-text)' },
  makeup: { bg: 'var(--event-makeup-bg)', border: 'var(--event-makeup-border)', text: 'var(--event-makeup-text)' },
  special: { bg: 'var(--event-special-bg)', border: 'var(--event-special-border)', text: 'var(--event-special-text)' },
  canceled: { bg: 'var(--event-canceled-bg)', border: 'var(--event-canceled-border)', text: 'var(--event-canceled-text)' },
};

const INTAKE_COLORS = { bg: 'var(--event-intake-bg)', border: 'var(--event-intake-border)', text: 'var(--event-intake-text)' };

type Props = {
  slot: CalendarTimeSlot;
  top: number;
  height: number;
  selected: boolean;
  onSelect: () => void;
};

export function ScheduleCalendarSlot({ slot, top, height, selected, onSelect }: Props) {
  const hasMixed = slot.lessonCount > 0 && slot.intakeCount > 0;
  const primaryLesson = slot.items.find((i) => i.kind === 'lesson');
  const lessonColors =
    primaryLesson?.kind === 'lesson'
      ? LESSON_COLORS[primaryLesson.event.scheduleType as ScheduleType] ?? LESSON_COLORS.regular
      : INTAKE_COLORS;
  const colors = hasMixed
    ? { bg: 'var(--app-surface-2)', border: 'var(--app-slate-text)', text: 'var(--app-ink)' }
    : slot.intakeCount > 0 && slot.lessonCount === 0
      ? INTAKE_COLORS
      : lessonColors;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('app-cal-event app-cal-event-stack text-left app-fade-in')}
      style={{
        top,
        height,
        background: colors.bg,
        borderLeftColor: colors.border,
        boxShadow: selected ? 'var(--s-md)' : undefined,
        outline: selected ? `2px solid ${colors.border}` : 'none',
        outlineOffset: 1,
      }}
    >
      <div className="px-1.5 py-1 h-full flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          <span className="text-[9px] font-bold tabular-nums" style={{ color: colors.text }}>
            {slot.startTime.slice(0, 5)}
          </span>
          {slot.lessonCount > 0 && (
            <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-indigo-100 text-indigo-800">
              수업 {slot.lessonCount}
            </span>
          )}
          {slot.intakeCount > 0 && (
            <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-cyan-100 text-cyan-900">
              상담 {slot.intakeCount}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
          {slot.items.map((item) => {
            if (item.kind === 'lesson') {
              const ev = item.event;
              const isCanceled = ev.scheduleType === 'canceled';
              return (
                <p
                  key={ev.id}
                  className={cn(
                    'text-[10px] font-semibold leading-tight truncate',
                    isCanceled && 'line-through'
                  )}
                  style={{ color: LESSON_COLORS[ev.scheduleType as ScheduleType]?.text ?? colors.text }}
                >
                  {ev.className}
                </p>
              );
            }
            return (
              <p
                key={item.event.id}
                className="text-[10px] font-semibold leading-tight truncate"
                style={{ color: INTAKE_COLORS.text }}
              >
                신입 상담 · {item.event.prospectName}
              </p>
            );
          })}
        </div>

        {height >= 52 && (
          <p className="text-[9px] truncate shrink-0" style={{ color: colors.text, opacity: 0.7 }}>
            {formatTimeRange(slot.startTime, slot.endTime)}
          </p>
        )}
      </div>
    </button>
  );
}
