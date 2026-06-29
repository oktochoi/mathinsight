import type { AttendanceStatus, HomeworkStatus } from '@/types/database';

export type LessonFormRow = {
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  score: string;
  tags: string[];
  note: string;
};

export const EMPTY_LESSON_FORM_ROW: LessonFormRow = {
  attendance: 'present',
  homework: 'complete',
  score: '',
  tags: [],
  note: '',
};

export function mergeLessonFormRow(
  partial?: Partial<LessonFormRow> | null
): LessonFormRow {
  return { ...EMPTY_LESSON_FORM_ROW, ...partial };
}
