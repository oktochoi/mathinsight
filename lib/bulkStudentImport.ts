import { STUDENT_GRADE_OPTIONS } from '@/lib/gradeOptions';

export type BulkStudentRow = {
  name: string;
  grade: string;
  school: string;
};

const GRADE_SET = new Set<string>(STUDENT_GRADE_OPTIONS);

/** 한 줄: "이름, 학년, 학교" 또는 "이름\t학년\t학교" */
export function parseBulkStudentLines(text: string): { rows: BulkStudentRow[]; errors: string[] } {
  const rows: BulkStudentRow[] = [];
  const errors: string[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const parts = line.includes('\t') ? line.split('\t') : line.split(',').map((p) => p.trim());

    const name = parts[0]?.trim() ?? '';
    if (!name) {
      errors.push(`${lineNo}행: 이름이 없습니다.`);
      return;
    }

    const gradeRaw = parts[1]?.trim() ?? '중1';
    const grade = GRADE_SET.has(gradeRaw) ? gradeRaw : '중1';
    if (parts[1]?.trim() && !GRADE_SET.has(gradeRaw)) {
      errors.push(`${lineNo}행: 학년 "${gradeRaw}" → 중1으로 등록합니다.`);
    }

    const school = parts[2]?.trim() ?? '';
    rows.push({ name, grade, school });
  });

  return { rows, errors };
}

export const BULK_STUDENT_PLACEHOLDER = `홍길동, 중2, OO중학교
김철수, 중1, XX중학교
이영희, 고1`;
