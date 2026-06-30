/** 학생 학년 선택 (초1~고3) */
export const STUDENT_GRADE_OPTIONS = [
  '초1',
  '초2',
  '초3',
  '초4',
  '초5',
  '초6',
  '중1',
  '중2',
  '중3',
  '고1',
  '고2',
  '고3',
] as const;

export type StudentGrade = (typeof STUDENT_GRADE_OPTIONS)[number];
