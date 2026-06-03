import type {
  ConsultationCard,
  ConsultationFollowup,
  LessonLog,
  StudentStatus,
} from '@/types/database';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRepeatedTags,
} from '@/lib/analytics';

function sortLogs(logs: LessonLog[]): LessonLog[] {
  return [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
}

/** UI·필터용 자동 위험 등급 (DB status와 매핑) */
export type RiskDisplayKind =
  | 'consultation'
  | 'makeup'
  | 'attention'
  | 'recovering'
  | 'stable';

export interface RiskSignal {
  id: string;
  label: string;
}

export interface StudentRiskAssessment {
  kind: RiskDisplayKind;
  kindLabel: string;
  status: StudentStatus;
  signals: RiskSignal[];
  /** 상담 준비 30초 요약 (불릿) */
  briefingLines: string[];
}

export const KIND_LABELS: Record<RiskDisplayKind, string> = {
  consultation: '상담 권장',
  makeup: '보강 권장',
  attention: '주의 필요',
  recovering: '회복 중',
  stable: '양호',
};

/** 대시보드 「확인할 학생」 — 조치가 분명한 경우만 */
export function riskNeedsStaffAction(kind: RiskDisplayKind): boolean {
  return kind === 'consultation' || kind === 'makeup';
}

function unitStagnation(logs: LessonLog[]): boolean {
  const recent = sortLogs(logs).slice(0, 4);
  if (recent.length < 3) return false;
  const units = recent.map((l) => l.unit?.trim()).filter(Boolean);
  if (units.length < 3) return false;
  const first = units[0];
  return units.every((u) => u === first);
}

function noImprovementAfterConsult(
  logs: LessonLog[],
  lastCard: ConsultationCard | undefined,
  followups: ConsultationFollowup[]
): boolean {
  if (!lastCard) return false;
  const anchor = lastCard.period_end;
  const after = sortLogs(logs).filter((l) => l.lesson_date > anchor);
  if (after.length === 0) return pendingFollowupsOnly(followups);

  const missing = after.filter((l) => l.homework_status === 'missing').length;
  const trend = calculateScoreTrend(after);
  return missing >= 1 || trend.direction === 'down';
}

function pendingFollowupsOnly(followups: ConsultationFollowup[]): boolean {
  return followups.some((f) => f.status === 'pending');
}

export function assessStudentRisk(
  logs: LessonLog[],
  options?: {
    followups?: ConsultationFollowup[];
    lastCard?: ConsultationCard;
  }
): StudentRiskAssessment {
  const followups = options?.followups ?? [];
  const lastCard = options?.lastCard;
  const recent = sortLogs(logs).slice(0, 8);
  const signals: RiskSignal[] = [];

  if (recent.length === 0) {
    return {
      kind: 'stable',
      kindLabel: KIND_LABELS.stable,
      status: 'stable',
      signals: [{ id: 'no_logs', label: '수업 기록 없음' }],
      briefingLines: ['아직 수업 기록이 없어 흐름 분석이 어렵습니다.'],
    };
  }

  const missingRecent = recent.filter((l) => l.homework_status === 'missing').length;
  const partialRecent = recent.filter((l) => l.homework_status === 'partial').length;
  const scoreTrend = calculateScoreTrend(recent);
  const hwTrend = calculateHomeworkTrend(recent);
  const repeatedTags = getRepeatedTags(recent, 2);
  const stagnant = unitStagnation(recent);
  const afterConsult =
    lastCard?.consultation_status === 'completed'
      ? noImprovementAfterConsult(logs, lastCard, followups)
      : false;

  if (scoreTrend.direction === 'down' && scoreTrend.delta != null) {
    signals.push({
      id: 'score_down',
      label: `점수 하락 추세 (기록 기준 ${scoreTrend.delta}점)`,
    });
  }
  if (missingRecent >= 2) {
    signals.push({ id: 'hw_missing', label: `숙제 미제출 ${missingRecent}회` });
  }
  if (partialRecent >= 3) {
    signals.push({ id: 'hw_partial', label: `숙제 부분 제출 ${partialRecent}회` });
  }
  const tagsWithOtherIssues =
    repeatedTags.length > 0 &&
    (missingRecent >= 1 ||
      scoreTrend.direction === 'down' ||
      stagnant ||
      partialRecent >= 2);
  if (tagsWithOtherIssues) {
    signals.push({
      id: 'tags',
      label: `반복 태그: ${repeatedTags.slice(0, 2).join(', ')}`,
    });
  }
  if (stagnant) {
    signals.push({ id: 'unit_stuck', label: '동일 단원 장기 정체(기록)' });
  }
  if (afterConsult && lastCard) {
    signals.push({ id: 'post_consult', label: '상담 이후 개선 흐름 미약(기록)' });
  }
  if (pendingFollowupsOnly(followups)) {
    signals.push({
      id: 'followup',
      label: `상담 후 확인 ${followups.filter((f) => f.status === 'pending').length}건`,
    });
  }

  const recovering =
    scoreTrend.direction === 'up' &&
    scoreTrend.delta != null &&
    scoreTrend.delta >= 3 &&
    missingRecent === 0 &&
    hwTrend.recentRate >= 70;

  const scoreDropStrong =
    scoreTrend.direction === 'down' && (scoreTrend.delta ?? 0) <= -10;
  const scoreDropModerate =
    scoreTrend.direction === 'down' && (scoreTrend.delta ?? 0) <= -8;

  let severity = 0;
  if (missingRecent >= 3) severity += 4;
  else if (missingRecent >= 2) severity += 2;
  if (scoreDropStrong) severity += 4;
  else if (scoreDropModerate) severity += 2;
  if (stagnant) severity += 2;
  if (repeatedTags.length >= 2 && (missingRecent >= 1 || scoreDropModerate || stagnant)) {
    severity += 2;
  } else if (repeatedTags.length >= 1 && missingRecent >= 2) {
    severity += 1;
  }
  if (afterConsult && lastCard && (missingRecent >= 1 || scoreDropModerate)) severity += 2;
  if (partialRecent >= 3) severity += 1;
  if (pendingFollowupsOnly(followups) && missingRecent >= 1) severity += 1;

  let kind: RiskDisplayKind;

  if (
    missingRecent >= 3 ||
    scoreDropStrong ||
    (afterConsult && lastCard && missingRecent >= 2 && scoreDropModerate) ||
    severity >= 5
  ) {
    kind = 'consultation';
  } else if (
    missingRecent >= 2 ||
    scoreDropModerate ||
    stagnant ||
    (repeatedTags.length >= 2 && missingRecent >= 1 && scoreTrend.direction !== 'up') ||
    severity >= 2
  ) {
    kind = 'makeup';
  } else if (recovering) {
    kind = 'recovering';
  } else if (severity >= 1) {
    kind = 'attention';
  } else {
    kind = 'stable';
  }

  if (kind === 'stable' || kind === 'recovering') {
    const positive =
      kind === 'recovering'
        ? { id: 'recovering', label: '최근 기록상 개선·안정 흐름' }
        : { id: 'ok', label: '최근 기록상 눈에 띄는 이슈 없음' };
    signals.length = 0;
    signals.push(positive);
  }

  const status: StudentStatus =
    kind === 'consultation'
      ? 'consultation'
      : kind === 'stable' || kind === 'recovering'
        ? 'stable'
        : 'attention';

  return {
    kind,
    kindLabel: KIND_LABELS[kind],
    status,
    signals,
    briefingLines: buildBriefingLines(recent, hwTrend, scoreTrend, signals, kind),
  };
}

function buildBriefingLines(
  recent: LessonLog[],
  hwTrend: ReturnType<typeof calculateHomeworkTrend>,
  scoreTrend: ReturnType<typeof calculateScoreTrend>,
  signals: RiskSignal[],
  kind: RiskDisplayKind
): string[] {
  const lines: string[] = [];
  const units = [...new Set(recent.map((l) => l.unit?.trim()).filter(Boolean))].slice(0, 2);

  if (units.length > 0) {
    lines.push(`최근 단원: ${units.join(', ')}`);
  }
  if (hwTrend.recentRate > 0) {
    lines.push(`숙제 제출률 ${hwTrend.recentRate}% (기록 기준)`);
  }
  if (scoreTrend.recentAvg != null) {
    lines.push(
      `최근 점수 평균 ${scoreTrend.recentAvg}점${
        scoreTrend.direction === 'down' && scoreTrend.delta
          ? `, 이전 대비 ${scoreTrend.delta}점`
          : scoreTrend.direction === 'up' && scoreTrend.delta
            ? `, 이전 대비 +${scoreTrend.delta}점`
            : ''
      }`
    );
  }

  for (const s of signals.slice(0, 3)) {
    if (s.id !== 'stable') lines.push(s.label);
  }

  if (kind === 'consultation') {
    lines.push('상담 시 숙제 루틴·취약 단원을 기록과 함께 확인 권장');
  } else if (kind === 'makeup') {
    lines.push('보강·오답 정리로 단원 정체 완화 검토');
  } else if (kind === 'recovering') {
    lines.push('최근 회복 흐름 — 현재 학습 루틴 유지 점검');
  } else if (kind === 'stable') {
    lines.push('최근 기록 기준 양호 — 특별 조치 없이 관찰');
  }

  return [...new Set(lines)].slice(0, 6);
}

/** 기존 deriveStudentStatus 대체 — 자동 status 동기화용 */
export function deriveStudentStatusFromRisk(
  logs: LessonLog[],
  options?: Parameters<typeof assessStudentRisk>[1]
): StudentStatus {
  return assessStudentRisk(logs, options).status;
}

export const RISK_KIND_STYLES: Record<RiskDisplayKind, string> = {
  consultation: 'bg-red-50 text-red-700 border-red-200',
  makeup: 'bg-violet-50 text-violet-800 border-violet-200',
  attention: 'bg-amber-50 text-amber-800 border-amber-200',
  recovering: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  stable: 'bg-slate-50 text-slate-600 border-slate-200',
};
