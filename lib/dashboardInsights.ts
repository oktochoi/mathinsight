import type { DashboardStats, LessonLog } from '@/types/database';

/** 전주 대비 변화 (마지막 vs 이전) */
export function weekOverWeekDelta(points: { rate?: number; count?: number }[]): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const lastVal = last.rate ?? last.count ?? 0;
  const prevVal = prev.rate ?? prev.count ?? 0;
  if (prevVal === 0 && lastVal === 0) return null;
  return lastVal - prevVal;
}

/** 반별 숙제 미제출률 — AI 운영 요약용 */
export function findHighHomeworkClass(
  logs: LessonLog[],
  classNames: Map<string, string>
): string | null {
  const byClass = new Map<string, { total: number; missing: number }>();
  const recent = logs.filter((l) => {
    const d = new Date(l.lesson_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  for (const log of recent) {
    const key = log.class_id;
    const entry = byClass.get(key) ?? { total: 0, missing: 0 };
    entry.total++;
    if (log.homework_status === 'missing') entry.missing++;
    byClass.set(key, entry);
  }

  let worst: { id: string; rate: number } | null = null;
  for (const [id, { total, missing }] of byClass) {
    if (total < 3) continue;
    const rate = Math.round((missing / total) * 100);
    if (rate >= 30 && (!worst || rate > worst.rate)) {
      worst = { id, rate };
    }
  }
  if (!worst) return null;
  const name = classNames.get(worst.id) ?? '해당 반';
  return `오늘은 ${name} 숙제 미제출률이 ${worst.rate}%로 높습니다.`;
}

/** 학생 복합 신호 — AI 운영 요약용 */
export function findCompoundStudentAlert(
  logs: LessonLog[],
  studentNames: Map<string, string>
): string | null {
  const byStudent = new Map<string, LessonLog[]>();
  for (const log of logs.slice(0, 200)) {
    const arr = byStudent.get(log.student_id) ?? [];
    arr.push(log);
    byStudent.set(log.student_id, arr);
  }

  for (const [sid, slugs] of byStudent) {
    const recent = slugs.slice(0, 8);
    if (recent.length < 4) continue;
    const absent = recent.filter((l) => l.attendance_status === 'absent').length;
    const scores = recent.map((l) => l.test_score).filter((s): s is number => s != null);
    if (absent >= 2 && scores.length >= 2) {
      const drop = scores[0] - scores[scores.length - 1];
      if (drop >= 5) {
        const name = studentNames.get(sid) ?? '학생';
        return `${name} 학생은 최근 2주간 점수 하락과 결석이 함께 나타났습니다.`;
      }
    }
  }
  return null;
}
