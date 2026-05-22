import type { ConsultationFollowup, LessonLog, StudentBadge } from '@/types/database';
import {
  calculateScoreTrend,
  countMissingHomework,
  getRepeatedTags,
} from '@/lib/analytics';

/** 기록 기반·중립 표현만 사용 (판단·낙인 표현 금지) */
export function computeStudentBadges(
  logs: LessonLog[],
  followups: ConsultationFollowup[] = []
): StudentBadge[] {
  const badges: StudentBadge[] = [];
  const recent = [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
  const recent8 = recent.slice(0, 8);
  const missingCount = countMissingHomework(recent, 21);
  const missingInRecent = recent8.filter((l) => l.homework_status === 'missing').length;
  const trend = calculateScoreTrend(recent);
  const pendingFollowups = followups.filter((f) => f.status === 'pending');
  const repeatedTags = getRepeatedTags(recent8, 2);

  if (pendingFollowups.length > 0) {
    badges.push({
      type: 'followup',
      label: '상담 후 확인',
      reason:
        pendingFollowups.length === 1
          ? `확인 예정: ${pendingFollowups[0].title}`
          : `확인 예정 항목 ${pendingFollowups.length}건`,
    });
  }

  if (missingInRecent >= 2 || missingCount >= 2) {
    const total = recent8.length;
    badges.push({
      type: 'homework_check',
      label: '숙제 확인',
      reason:
        total > 0
          ? `최근 ${total}회 중 숙제 미제출 ${missingInRecent}회`
          : `최근 3주 숙제 미제출 ${missingCount}회 기록`,
    });
  }

  if (trend.direction === 'down' && trend.delta != null && trend.recentAvg != null) {
    const prev = trend.previousAvg ?? trend.recentAvg - trend.delta;
    badges.push({
      type: 'score_change',
      label: '점수 변화',
      reason: `최근 테스트 평균 ${prev}점 → ${trend.recentAvg}점 (기록 기준)`,
    });
  }

  if (repeatedTags.length > 0) {
    badges.push({
      type: 'needs_review',
      label: '확인 필요',
      reason: `특정 단원·메모 태그 반복: ${repeatedTags.slice(0, 2).join(', ')}`,
    });
  }

  if (badges.length === 0 && recent.length > 0) {
    badges.push({
      type: 'stable',
      label: '안정적',
      reason: '최근 기록 기준 눈에 띄는 이슈 패턴이 없습니다.',
    });
  }

  if (badges.length === 0) {
    badges.push({
      type: 'stable',
      label: '기록 없음',
      reason: '아직 수업 기록이 없습니다.',
    });
  }

  return badges;
}
