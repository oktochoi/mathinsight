import type { LessonLog } from '@/types/database';
import { AI_LIMITS } from '@/lib/ai/security';

function clipMemo(memo: string | null | undefined): string | null {
  if (!memo?.trim()) return null;
  const t = memo.trim();
  return t.length > AI_LIMITS.logMemo ? `${t.slice(0, AI_LIMITS.logMemo)}…` : t;
}

/** 프롬프트용 — 날짜순 정렬된 간결 기록 */
export function serializeLessonLogsForPrompt(logs: LessonLog[]): string {
  const sorted = [...logs]
    .sort((a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime())
    .slice(-AI_LIMITS.maxLogsInPrompt);

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
      const memo = clipMemo(log.memo);
      const parts = [
        log.lesson_date,
        log.unit ? `단원:${log.unit}` : null,
        `출결:${attendance}`,
        `숙제:${homework}`,
        log.test_score != null ? `점수:${log.test_score}` : null,
        log.tags?.length ? `태그:${log.tags.join(',')}` : null,
        memo ? `메모:${memo}` : null,
      ].filter(Boolean);
      return `- ${parts.join(' | ')}`;
    })
    .join('\n');
}
