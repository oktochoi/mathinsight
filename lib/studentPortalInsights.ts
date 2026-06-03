import type { LessonLog } from '@/types/database';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRecentUnits,
} from '@/lib/analytics';
import { buildParentRecentChanges } from '@/lib/learningFlow';

/** 학생 포털 — 오늘의 학습 포인트 (기록 기반) */
export function buildStudentStudyTips(logs: LessonLog[]): string[] {
  const tips: string[] = [];
  const hw = calculateHomeworkTrend(logs);
  const score = calculateScoreTrend(logs);
  const units = getRecentUnits(logs, 4);
  const missingRecent = logs
    .slice(0, 5)
    .filter((l) => l.homework_status === 'missing').length;

  if (logs.length === 0) {
    return [
      '수업 기록이 쌓이면 점수·숙제·선생님 메모를 여기서 볼 수 있어요.',
      '오늘 수업이 있다면 시간표를 먼저 확인해 보세요.',
    ];
  }

  if (units.length > 0) {
    tips.push(`최근 다룬 단원: ${units.join(', ')} — 복습할 때 참고하세요.`);
  }

  if (missingRecent >= 2) {
    tips.push('최근 숙제 미제출이 있어요. 다음 수업 전까지 제출 루틴을 맞춰 보세요.');
  } else if (hw.recentRate >= 80) {
    tips.push('숙제 제출이 잘 되고 있어요. 이대로 꾸준히 이어 가면 좋겠습니다.');
  } else if (hw.recentRate > 0 && hw.recentRate < 70) {
    tips.push(`최근 숙제 제출률이 ${hw.recentRate}%예요. 하루 고정 시간에 숙제를 확인해 보세요.`);
  }

  if (score.direction === 'down' && score.delta != null) {
    tips.push(
      `최근 점수가 기록상 ${Math.abs(score.delta)}점 정도 내려갔어요. 틀린 문제를 노트에 정리해 보세요.`
    );
  } else if (score.direction === 'up') {
    tips.push('점수가 올라가는 흐름이에요. 같은 방식으로 복습을 이어 가 보세요.');
  }

  const memoLog = logs.find((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0);
  if (memoLog?.tags?.length) {
    tips.push(`선생님 메모 태그: ${memoLog.tags.join(', ')} — 다음 수업 전에 한번 더 볼까요?`);
  } else if (memoLog?.memo?.trim()) {
    tips.push('선생님 메모가 있어요. 「선생님 피드백」에서 내용을 확인하세요.');
  }

  if (tips.length < 2) {
    tips.push('수업 후 10분만 오답 정리를 해도 다음 시험에 도움이 됩니다.');
  }

  return tips.slice(0, 5);
}

export function buildStudentProgressLines(logs: LessonLog[]): string[] {
  return buildParentRecentChanges(logs);
}
