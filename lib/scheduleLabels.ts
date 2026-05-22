import type { ScheduleExceptionType, ScheduleType } from '@/types/database';

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  regular: '정기수업',
  makeup: '보강',
  special: '특강',
  canceled: '휴강',
};

export const EXCEPTION_TYPE_LABELS: Record<ScheduleExceptionType, string> = {
  makeup: '보강',
  canceled: '휴강',
  time_changed: '시간 변경',
  special: '특강',
};

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** 시간표·캘린더 칩용 (유형별 색) */
export const SCHEDULE_TYPE_STYLES: Record<
  ScheduleType,
  { chip: string; border: string; dot: string; label: string }
> = {
  regular: {
    label: '정기수업',
    dot: 'bg-indigo-500',
    border: 'border-l-indigo-500',
    chip:
      'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100 ring-indigo-100',
  },
  makeup: {
    label: '보강',
    dot: 'bg-sky-500',
    border: 'border-l-sky-500',
    chip: 'bg-sky-50 text-sky-950 border-sky-200 hover:bg-sky-100 ring-sky-100',
  },
  special: {
    label: '특강',
    dot: 'bg-violet-500',
    border: 'border-l-violet-500',
    chip:
      'bg-violet-50 text-violet-950 border-violet-200 hover:bg-violet-100 ring-violet-100',
  },
  canceled: {
    label: '휴강',
    dot: 'bg-slate-400',
    border: 'border-l-slate-400',
    chip:
      'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-75 hover:bg-slate-150',
  },
};

export function scheduleLocationLabel(location: string | null | undefined): string {
  const t = location?.trim();
  return t ? t : '장소 미입력';
}
