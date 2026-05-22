import type { LessonLog, ReportTone, Student } from '@/types/database';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRepeatedTags,
  getRecentUnits,
  countMissingHomework,
} from '@/lib/analytics';

/** Rule-based generators — swap implementations for OpenAI later */

export function generateLearningSummary(logs: LessonLog[], studentName: string): string {
  const lines: string[] = [];
  const sorted = [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );

  if (sorted.length === 0) {
    return `${studentName} 학생의 해당 기간 수업 기록이 없습니다.`;
  }

  const units = getRecentUnits(sorted, 3);
  if (units.length > 0) {
    lines.push(`최근 학습 단원: ${units.join(', ')}.`);
  }

  const hw = calculateHomeworkTrend(sorted);
  if (hw.direction === 'down') {
    lines.push('최근 숙제 완료율이 이전보다 낮아졌습니다.');
  } else if (hw.recentRate >= 80) {
    lines.push(`숙제 완료율은 약 ${hw.recentRate}% 수준입니다.`);
  } else if (hw.recentRate > 0) {
    lines.push(`숙제 완료율은 약 ${hw.recentRate}%입니다.`);
  }

  const score = calculateScoreTrend(sorted);
  if (score.direction === 'down') {
    lines.push('최근 테스트 점수 하락 흐름이 보입니다.');
  } else if (score.direction === 'up') {
    lines.push('최근 테스트 점수는 소폭 상승했습니다.');
  } else if (score.recentAvg != null) {
    lines.push(`최근 테스트 평균은 약 ${score.recentAvg}점입니다.`);
  }

  const missing = countMissingHomework(sorted, 30);
  if (missing >= 2) {
    lines.push('최근 숙제 미제출 기록이 여러 번 있습니다.');
  }

  const tags = getRepeatedTags(sorted, 2);
  if (tags.length > 0) {
    lines.push(`반복적으로 나타난 특이사항: ${tags.join(', ')}.`);
  }

  const absent = sorted.filter((l) => l.attendance_status === 'absent').length;
  if (absent > 0) {
    lines.push(`해당 기간 결석 ${absent}회가 있습니다.`);
  }

  if (lines.length === 0) {
    return `${studentName} 학생은 해당 기간 특별한 이상 징후 없이 수업을 진행했습니다.`;
  }

  return lines.join(' ');
}

export function generateEvidenceSummary(logs: LessonLog[]): string {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
  const bullets: string[] = [];

  for (const log of sorted.slice(0, 6)) {
    const date = log.lesson_date.replace(/-/g, '.');
    const parts: string[] = [date];
    if (log.unit) parts.push(log.unit);
    parts.push(
      `출결 ${log.attendance_status === 'present' ? '출석' : log.attendance_status === 'late' ? '지각' : '결석'}`
    );
    parts.push(
      `숙제 ${log.homework_status === 'complete' ? '완료' : log.homework_status === 'partial' ? '부분' : '미제출'}`
    );
    if (log.test_score != null) parts.push(`점수 ${log.test_score}`);
    if (log.tags?.length) parts.push(`태그: ${log.tags.join(', ')}`);
    bullets.push(`· ${parts.join(' / ')}`);
  }

  if (bullets.length === 0) return '해당 기간 기록된 근거 데이터가 없습니다.';
  return bullets.join('\n');
}

export function generateConsultationPoints(logs: LessonLog[]): string[] {
  const points: string[] = [];
  const sorted = [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
  const missing = sorted.filter((l) => l.homework_status === 'missing').length;
  const score = calculateScoreTrend(sorted);

  if (missing >= 2) {
    points.push('숙제 미제출 패턴: 제출 습관과 일정을 함께 점검할 필요가 있습니다.');
  } else if (missing === 1) {
    points.push('최근 1회 숙제 미제출이 있어 확인이 필요합니다.');
  }

  if (score.direction === 'down') {
    points.push('테스트 점수 하락: 취약 단원과 오답 유형을 짚어볼 시점입니다.');
  }

  const tags = getRepeatedTags(sorted, 2);
  for (const tag of tags.slice(0, 2)) {
    points.push(`반복 태그 「${tag}」에 대한 보완 학습을 논의할 수 있습니다.`);
  }

  const absent = sorted.filter((l) => l.attendance_status === 'absent').length;
  if (absent > 0) {
    points.push(`결석 ${absent}회: 보강 계획을 안내해 주세요.`);
  }

  if (points.length === 0) {
    points.push('현재 기록 기준으로 긴급 이슈는 없습니다. 학습 목표를 공유하면 좋습니다.');
  }

  return points;
}

export function generateParentMessage(
  logs: LessonLog[],
  studentName: string,
  academyName: string
): string {
  const summary = generateLearningSummary(logs, studentName);
  return (
    `안녕하세요, ${academyName}입니다.\n\n` +
    `${studentName} 학생의 최근 학습을 공유드립니다.\n${summary}\n\n` +
    `궁금하신 점은 편하게 문의해 주세요.\n감사합니다.`
  );
}

const TONE_INTROS: Record<ReportTone, string> = {
  friendly: '따뜻한 안부로',
  objective: '객관적인 데이터를 바탕으로',
  exam_focused: '시험·성적 관점에서',
  encouraging: '격려의 말씀과 함께',
};

/** Main entry — replace body with OpenAI call later */
export function generateParentReport(
  logs: LessonLog[],
  student: Pick<Student, 'name' | 'grade'>,
  periodStart: string,
  periodEnd: string,
  tone: ReportTone,
  academyName: string
): string {
  const intro = TONE_INTROS[tone];
  const summary = generateLearningSummary(logs, student.name);
  const evidence = generateEvidenceSummary(logs);
  const units = getRecentUnits(logs, 4);
  const hw = calculateHomeworkTrend(logs);
  const score = calculateScoreTrend(logs);

  const periodLabel = `${periodStart} ~ ${periodEnd}`;

  let closing = '궁금하신 점은 언제든 편하게 연락 주세요.';
  if (tone === 'encouraging') {
    closing = '꾸준히 응원하겠습니다. 함께 목표를 맞춰 가면 좋겠습니다.';
  } else if (tone === 'exam_focused') {
    closing = '다음 평가 전 취약 영역 보완 계획을 공유드리겠습니다.';
  }

  const hwLines =
    hw.recentRate > 0
      ? `이 기간 숙제 완료율은 기록상 약 ${hw.recentRate}%입니다.${
          hw.direction === 'down' ? ' 최근 제출이 줄었습니다.' : ''
        }`
      : '이 기간 숙제 관련 기록을 확인해 주세요.';

  const scoreLines =
    score.recentAvg != null
      ? `기록된 점수 흐름을 보면 최근 평균은 약 ${score.recentAvg}점입니다.${
          score.direction === 'up'
            ? ' 이전보다 올라간 흐름이 있습니다.'
            : score.direction === 'down'
              ? ' 하락 추세가 기록에 있습니다.'
              : ''
        }`
      : '이 기간 기록된 점수가 없습니다.';

  const unitLines =
    units.length > 0
      ? `수업에서는 ${units.join(', ')} 단원을 다루었습니다.`
      : '이 기간 다룬 단원은 수업 기록을 참고해 주세요.';

  return [
    `${student.name} 학생 학습 리포트 (${periodLabel})`,
    '',
    `안녕하세요, ${academyName}입니다. ${intro} ${periodLabel} 기간 학습 내용을 전달드립니다.`,
    '',
    '[이번 기간 한눈에]',
    summary,
    '',
    '[수업에서 다룬 내용]',
    unitLines,
    '',
    '[숙제와 학습 습관]',
    hwLines,
    '',
    '[평가·시험]',
    scoreLines,
    '',
    '[함께 보면 좋은 부분]',
    '기록을 바탕으로 가정에서 숙제 루틴과 오답 정리를 함께 점검해 주시면 도움이 됩니다.',
    '',
    '[맺음말]',
    closing,
    '',
    `${academyName} 드림`,
  ].join('\n');
}
