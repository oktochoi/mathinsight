import type {
  ConsultationCard,
  ConsultationFollowup,
  LessonLog,
} from '@/types/database';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRecentUnits,
  getRepeatedTags,
} from '@/lib/analytics';
import { assessStudentRisk } from '@/lib/studentRisk';

export interface StudentDigitalTwin {
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  recentChanges: string[];
  riskFactors: string[];
  /** 기록 기준 갱신 시점 */
  asOfDate: string;
}

function sortLogs(logs: LessonLog[]): LessonLog[] {
  return [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
}

export function buildStudentDigitalTwin(
  logs: LessonLog[],
  options?: {
    cards?: ConsultationCard[];
    followups?: ConsultationFollowup[];
  }
): StudentDigitalTwin {
  const recent = sortLogs(logs).slice(0, 12);
  const cards = options?.cards ?? [];
  const followups = options?.followups ?? [];
  const lastCard = cards.find((c) => c.consultation_status === 'completed') ?? cards[0];
  const risk = assessStudentRisk(logs, { followups, lastCard });

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const patterns: string[] = [];
  const recentChanges: string[] = [];
  const riskFactors: string[] = risk.signals.map((s) => s.label);

  const hw = calculateHomeworkTrend(recent);
  const score = calculateScoreTrend(recent);
  const tags = getRepeatedTags(recent, 2);
  const units = getRecentUnits(recent, 4);

  if (hw.recentRate >= 80) {
    strengths.push(`숙제 제출률 ${hw.recentRate}% 수준(최근 기록)`);
  }
  if (score.direction === 'up' && score.delta != null && score.delta >= 3) {
    strengths.push(`최근 점수 상승 흐름 (+${score.delta}점, 기록)`);
  }
  if (recent.filter((l) => l.tags?.includes('풀이 과정')).length >= 2) {
    strengths.push('풀이 과정 정리 관련 긍정 메모 반복');
  }
  if (recent.every((l) => l.attendance_status === 'present') && recent.length >= 3) {
    strengths.push('최근 출석 기록 안정적');
  }

  if (hw.recentRate < 70 && recent.length > 0) {
    weaknesses.push(`숙제 완료율 ${hw.recentRate}% (기록)`);
  }
  if (score.direction === 'down' && score.delta != null) {
    weaknesses.push(`점수 하락 추세 (약 ${score.delta}점, 기록)`);
  }
  for (const tag of tags) {
    if (['계산 실수', '개념 보완', '숙제 확인'].includes(tag)) {
      weaknesses.push(`반복 태그: ${tag}`);
    }
  }
  if (recent.filter((l) => l.homework_status === 'missing').length >= 2) {
    weaknesses.push('숙제 미제출 다회 기록');
  }

  const missingLate = recent.filter((l) => l.homework_status === 'missing').length;
  if (missingLate >= 2) {
    patterns.push('최근 숙제 미제출이 간헐적으로 반복');
  }
  if (tags.length > 0) {
    patterns.push(`동일 메모·태그 반복: ${tags.join(', ')}`);
  }
  const unitsRecent = recent.slice(0, 4).map((l) => l.unit?.trim()).filter(Boolean);
  if (unitsRecent.length >= 3 && new Set(unitsRecent).size === 1) {
    patterns.push(`동일 단원(${unitsRecent[0]}) 장기 진행`);
  }

  if (score.direction === 'up') {
    recentChanges.push('최근 시험 점수 상승 흐름(기록)');
  } else if (score.direction === 'down') {
    recentChanges.push('최근 시험 점수 하락 흐름(기록)');
  }
  if (hw.direction === 'down') {
    recentChanges.push('숙제 제출률이 이전보다 낮아짐(기록)');
  } else if (hw.direction === 'up') {
    recentChanges.push('숙제 제출이 안정·개선된 흐름(기록)');
  }
  if (units.length > 0) {
    recentChanges.push(`최근 학습 단원: ${units.slice(0, 3).join(' → ')}`);
  }
  if (risk.kindLabel) {
    recentChanges.push(`자동 위험 등급: ${risk.kindLabel}`);
  }

  if (strengths.length === 0) {
    strengths.push('아직 뚜렷한 강점 패턴이 기록되지 않았습니다.');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('기록상 뚜렷한 약점 패턴은 없습니다.');
  }
  if (patterns.length === 0) {
    patterns.push('반복 패턴이 뚜렷하지 않습니다.');
  }
  if (recentChanges.length === 0) {
    recentChanges.push('최근 4주 기록 변화가 크지 않습니다.');
  }
  if (riskFactors.length === 0) {
    riskFactors.push('현재 기록 기준 특이 위험 신호 없음');
  }

  const asOfDate =
    recent[0]?.lesson_date ?? new Date().toISOString().slice(0, 10);

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    patterns: patterns.slice(0, 4),
    recentChanges: recentChanges.slice(0, 4),
    riskFactors: riskFactors.slice(0, 4),
    asOfDate,
  };
}
