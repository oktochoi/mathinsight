import type { LessonLog, Student } from '@/types/database';
import type { StudentPayment } from '@/types/database';

export type RetentionRiskLevel = 'low' | 'medium' | 'high';

export interface RetentionAssessment {
  riskLevel: RetentionRiskLevel;
  score: number;
  reason: string;
  signals: { id: string; label: string }[];
  recommendedAction: string;
}

const LEVEL_LABELS: Record<RetentionRiskLevel, string> = {
  low: '재등록 양호',
  medium: '상담 권장',
  high: '상담 우선',
};

export { LEVEL_LABELS as RETENTION_LEVEL_LABELS };

export function assessRetentionRisk(input: {
  student: Pick<Student, 'status' | 'name'>;
  logs: LessonLog[];
  overduePayments: number;
  absentRecent: number;
  pendingCounseling: boolean;
}): RetentionAssessment {
  const signals: { id: string; label: string }[] = [];
  let score = 0;

  if (input.overduePayments > 0) {
    score += 3;
    signals.push({ id: 'payment', label: `미납 수강료 ${input.overduePayments}건` });
  }
  if (input.absentRecent >= 2) {
    score += 2;
    signals.push({ id: 'absent', label: `최근 결석 ${input.absentRecent}회` });
  }
  if (input.student.status === 'consultation') {
    score += 2;
    signals.push({ id: 'consult', label: '상담 권장 상태 지속' });
  } else if (input.student.status === 'attention') {
    score += 1;
    signals.push({ id: 'attention', label: '보강 권장 상태' });
  }

  const missingHw = input.logs
    .slice(0, 6)
    .filter((l) => l.homework_status === 'missing').length;
  if (missingHw >= 2) {
    score += 2;
    signals.push({ id: 'hw', label: `숙제 미제출 ${missingHw}회` });
  }

  if (input.pendingCounseling) {
    score += 1;
    signals.push({ id: 'counsel_pending', label: '미완료 상담 예정' });
  }

  let riskLevel: RetentionRiskLevel = 'low';
  if (score >= 5) riskLevel = 'high';
  else if (score >= 2) riskLevel = 'medium';

  const reason =
    signals.length > 0
      ? signals.map((s) => s.label).join(' · ')
      : '최근 이탈 신호 없음';

  const recommendedAction =
    riskLevel === 'high'
      ? '재등록 상담을 1주 내 잡고, 학부모 연락·수강료·출결을 함께 점검하세요.'
      : riskLevel === 'medium'
        ? '다음 상담 때 재등록 의사를 확인하고 학습 만족도를 물어보세요.'
        : '현재 루틴 유지. 분기별 재등록 안내로 충분합니다.';

  return { riskLevel, score, reason, signals, recommendedAction };
}

export function paymentOverdue(p: StudentPayment, today = new Date().toISOString().slice(0, 10)): boolean {
  return p.status === 'pending' && p.due_date < today;
}
