import type { AttendanceStatus, HomeworkStatus } from '@/types/database';

export const LESSON_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  scheduled: {
    bg: 'var(--app-warning-bg)',
    text: 'var(--app-warning-text)',
    border: 'var(--app-warning-border)',
    label: '수업 예정',
  },
  in_progress: {
    bg: 'var(--app-success-bg)',
    text: 'var(--app-success-text)',
    border: 'var(--app-success-border)',
    label: '진행 중',
  },
  closed: {
    bg: 'var(--app-surface-2)',
    text: 'var(--app-ink-3)',
    border: 'var(--app-border)',
    label: '마감',
  },
};

export const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: '출석' },
  { value: 'late', label: '지각' },
  { value: 'absent', label: '결석' },
];

export const homeworkOptions: { value: HomeworkStatus; label: string }[] = [
  { value: 'complete', label: '완료' },
  { value: 'partial', label: '부분' },
  { value: 'missing', label: '미제출' },
];

export function lessonInputStyle(disabled: boolean) {
  return {
    background: 'var(--app-surface-2)',
    border: '1px solid var(--app-border)',
    color: disabled ? 'var(--app-ink-4)' : 'var(--app-ink)',
    outline: 'none' as const,
    opacity: disabled ? 0.6 : 1,
  };
}

export function formatLessonTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
