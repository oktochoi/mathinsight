import type { LessonLog } from '@/types/database';

/** 프롬프트용 — 날짜순 정렬된 간결 기록 */
export function serializeLessonLogsForPrompt(logs: LessonLog[]): string {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
  );

  if (sorted.length === 0) {
    return '(해당 기간 수업 기록 없음)';
  }

  return sorted
    .map((log) => {
      const attendance =
        log.attendance_status === 'present'
          ? '출석'
          : log.attendance_status === 'late'
            ? '지각'
            : '결석';
      const homework =
        log.homework_status === 'complete'
          ? '완료'
          : log.homework_status === 'partial'
            ? '부분'
            : '미제출';
      const parts = [
        log.lesson_date,
        log.unit ? `단원:${log.unit}` : null,
        `출결:${attendance}`,
        `숙제:${homework}`,
        log.test_score != null ? `점수:${log.test_score}` : null,
        log.tags?.length ? `태그:${log.tags.join(',')}` : null,
        log.memo ? `메모:${log.memo}` : null,
      ].filter(Boolean);
      return `- ${parts.join(' | ')}`;
    })
    .join('\n');
}
