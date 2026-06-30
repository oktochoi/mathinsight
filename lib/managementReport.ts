import { formatWon } from '@/lib/billingOperations';
import type { BillingKpis } from '@/lib/billingOperations';
import type { StudentGrowthMetrics } from '@/lib/studentGrowth';
import type { ClassRow, CounselingSession, DashboardStats, IntakeConsultation, Student } from '@/types/database';

export const OPS_TARGETS = {
  attendance: 95,
  homework: 90,
  counseling: 80,
} as const;

export type PerformanceMetric = {
  key: string;
  label: string;
  value: number;
  target: number;
  met: boolean;
};

export type ClassAnalysisRow = {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  delta: number;
};

export type ReportAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone?: 'default' | 'warning' | 'urgent';
};

export type CounselingFunnel = {
  booked: number;
  completed: number;
  registered: number;
  conversionRate: number | null;
  placeholder?: boolean;
};

export function monthLabel(ref = new Date()) {
  return `${ref.getFullYear()}년 ${ref.getMonth() + 1}월`;
}

function latestRate(trend: { rate?: number | null }[]): number {
  const last = trend[trend.length - 1];
  return last?.rate != null ? Math.round(last.rate) : 0;
}

export function buildPerformanceMetrics(stats: DashboardStats): PerformanceMetric[] {
  const attendance = latestRate(stats.weeklyAttendanceTrend);
  const homework = stats.homeworkTrend.at(-1)?.rate ?? 0;
  const counseling = stats.consultationCompletionRate ?? 0;

  return [
    {
      key: 'attendance',
      label: '출석률',
      value: attendance,
      target: OPS_TARGETS.attendance,
      met: attendance >= OPS_TARGETS.attendance,
    },
    {
      key: 'homework',
      label: '숙제 완료율',
      value: Math.round(homework),
      target: OPS_TARGETS.homework,
      met: homework >= OPS_TARGETS.homework,
    },
    {
      key: 'counseling',
      label: '상담 완료율',
      value: Math.round(counseling),
      target: OPS_TARGETS.counseling,
      met: counseling >= OPS_TARGETS.counseling,
    },
  ];
}

export function buildClassAnalysis(
  classes: ClassRow[],
  students: Student[],
  growth: StudentGrowthMetrics
): ClassAnalysisRow[] {
  const newByName = new Map(growth.newByClass.map((c) => [c.name, c.count]));

  return classes
    .map((c) => {
      const studentCount = students.filter(
        (s) => s.class_id === c.id && s.enrollment_status === 'active'
      ).length;
      const newInClass = newByName.get(c.name) ?? 0;
      const withdrawnInClass = students.filter(
        (s) =>
          s.class_id === c.id &&
          s.withdrawn_at &&
          s.withdrawn_at.startsWith(
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
          )
      ).length;
      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        studentCount,
        delta: newInClass - withdrawnInClass,
      };
    })
    .sort((a, b) => b.studentCount - a.studentCount);
}

export function buildCounselingFunnel(
  sessions: Pick<CounselingSession, 'status'>[],
  intakes: Pick<IntakeConsultation, 'intake_status'>[]
): CounselingFunnel {
  const booked =
    sessions.filter((s) =>
      ['scheduled', 'in_progress', 'completed', 'followup_needed'].includes(s.status)
    ).length +
    intakes.filter((i) => !['no_show', 'not_registered'].includes(i.intake_status)).length;

  const completed =
    sessions.filter((s) => s.status === 'completed' || s.status === 'followup_needed').length +
    intakes.filter((i) => ['completed', 'registered'].includes(i.intake_status)).length;

  const registered =
    intakes.filter((i) => i.intake_status === 'registered').length +
    sessions.filter((s) => s.status === 'completed').length;

  const conversionRate =
    booked > 0 ? Math.round((registered / booked) * 100) : null;

  return {
    booked,
    completed,
    registered,
    conversionRate,
    placeholder: booked === 0 && intakes.length === 0,
  };
}

export function buildMonthlySummary(
  growth: StudentGrowthMetrics,
  stats: DashboardStats,
  billing: BillingKpis
): string[] {
  const lines: string[] = [];

  if (growth.monthDelta !== 0) {
    lines.push(
      `이번 달 재원생은 지난달보다 ${Math.abs(growth.monthDelta)}명 ${growth.monthDelta > 0 ? '증가' : '감소'}했습니다.`
    );
  } else {
    lines.push('이번 달 재원생 수는 지난달과 동일합니다.');
  }

  if (growth.monthlyChanges.newRegistrations > 0) {
    lines.push(`신규 등록 ${growth.monthlyChanges.newRegistrations}명이 있습니다.`);
  }

  if (growth.monthlyChanges.withdrawals > 0) {
    lines.push(`퇴원 ${growth.monthlyChanges.withdrawals}명 — 이탈 흐름을 확인하세요.`);
  }

  const topClass = growth.newByClass[0];
  if (topClass) {
    lines.push(`${topClass.name}에 신규 ${topClass.count}명이 배정되었습니다.`);
  }

  if (billing.overdueStudentCount > 0) {
    lines.push(`연체 학생 ${billing.overdueStudentCount}명 — 수납 점검이 필요합니다.`);
  } else if (billing.outstandingStudentCount > 0) {
    lines.push(`미수금 학생 ${billing.outstandingStudentCount}명이 있습니다.`);
  } else if (billing.collectedMonthDeltaPct > 0) {
    lines.push(`이번 달 수납은 지난달보다 ${billing.collectedMonthDeltaPct}% 증가했습니다.`);
  }

  if (stats.consultationCompletionRate >= OPS_TARGETS.counseling) {
    lines.push(`상담 완료율 ${stats.consultationCompletionRate}%로 목표를 달성했습니다.`);
  }

  return [...new Set(lines)].slice(0, 5);
}

export function buildActionCenter(input: {
  classRows: ClassAnalysisRow[];
  billing: BillingKpis;
  stats: DashboardStats;
  growth: StudentGrowthMetrics;
  intakePending: number;
}): ReportAction[] {
  const actions: ReportAction[] = [];

  const shrinking = input.classRows.filter((c) => c.delta < 0).slice(0, 2);
  for (const c of shrinking) {
    actions.push({
      id: `class-${c.id}`,
      title: '학생 감소 반',
      description: `${c.name} (${c.grade}) · ${c.delta}명`,
      href: `/classes`,
      tone: 'warning',
    });
  }

  if (input.billing.overdueStudentCount > 0) {
    actions.push({
      id: 'overdue',
      title: '미납·연체 학생',
      description: `연체 ${input.billing.overdueStudentCount}명 · 미수 ${formatWon(input.billing.outstanding)}`,
      href: '/billing?filter=overdue',
      tone: 'urgent',
    });
  } else if (input.billing.outstandingStudentCount > 0) {
    actions.push({
      id: 'outstanding',
      title: '미납 학생',
      description: `${input.billing.outstandingStudentCount}명 · ${formatWon(input.billing.outstanding)}`,
      href: '/billing?filter=pending',
      tone: 'warning',
    });
  }

  if (input.intakePending > 0) {
    actions.push({
      id: 'intake',
      title: '신입 상담 대기',
      description: `${input.intakePending}건 상담·등록 검토`,
      href: '/counseling?step=intake',
    });
  }

  if (input.stats.unclosedLessonsToday.length > 0) {
    actions.push({
      id: 'unclosed',
      title: '수업 미마감',
      description: `오늘 ${input.stats.unclosedLessonsToday.length}개 수업`,
      href: '/lesson-logs',
      tone: 'warning',
    });
  }

  if (input.growth.attention.reregistrationPending > 0) {
    actions.push({
      id: 'rereg',
      title: '재등록 예정 학생',
      description: `${input.growth.attention.reregistrationPending}명 상담·연락 필요`,
      href: '/analytics#attention',
    });
  }

  if (input.growth.attention.longAbsence > 0) {
    actions.push({
      id: 'absence',
      title: '장기 결석 학생',
      description: `${input.growth.attention.longAbsence}명 연락 권장`,
      href: '/analytics#attention',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'dashboard',
      title: '오늘 운영 확인',
      description: '특별 조치 항목 없음 — 오늘 현황을 확인하세요',
      href: '/dashboard',
    });
  }

  return actions.slice(0, 6);
}

export function buildAiInsights(
  growth: StudentGrowthMetrics,
  stats: DashboardStats,
  billingInsights: string[]
): string[] {
  const fromRecs = stats.aiRecommendations.map(
    (r) => `${r.studentName}: ${r.reason}`
  );
  const merged = [
    ...growth.aiReport,
    ...growth.insights,
    ...billingInsights,
    ...fromRecs,
  ];
  return [...new Set(merged)].slice(0, 6);
}

export function billingCollectionRate(kpis: BillingKpis): number {
  const total = kpis.collectedThisMonth + kpis.outstanding;
  if (total <= 0) return 100;
  return Math.round((kpis.collectedThisMonth / total) * 100);
}
