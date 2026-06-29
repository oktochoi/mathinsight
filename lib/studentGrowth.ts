import type {
  ConsultationCard,
  CounselingSession,
  LessonLog,
  ReregistrationRecord,
  RetentionSignal,
  Student,
} from '@/types/database';

export type GrowthTrendPoint = {
  key: string;
  label: string;
  total: number;
  newRegistrations: number;
  withdrawals: number;
};

export type StudentGrowthMetrics = {
  currentCount: number;
  prevMonthCount: number;
  monthDelta: number;
  monthDeltaPct: number;
  monthlyChanges: {
    newRegistrations: number;
    reregistrations: number;
    onLeave: number;
    withdrawals: number;
  };
  attention: {
    reregistrationPending: number;
    longAbsence: number;
    counselingIncomplete: number;
  };
  insights: string[];
  trend6: GrowthTrendPoint[];
  trend12: GrowthTrendPoint[];
  netGrowthThisMonth: number;
  reregistration: {
    total: number;
    completed: number;
    pending: number;
    incomplete: number;
    rate: number;
  };
  newByGrade: { name: string; count: number }[];
  newByClass: { name: string; count: number }[];
  newByTeacher: { name: string; count: number }[];
  churnReasons: { reason: string; count: number }[];
  aiReport: string[];
  prediction: {
    current: number;
    nextMonth: number;
    netDelta: number;
    atRisk: number;
    rationale: string[];
  };
  pendingReregStudentIds: string[];
  longAbsenceStudentIds: string[];
  counselingIncompleteStudentIds: string[];
};

const ACTIVE_STATUSES = new Set(['active', 'on_leave']);

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthEnd(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function inMonth(iso: string | null | undefined, ref = new Date()) {
  if (!iso) return false;
  const m = ref.getFullYear() * 12 + ref.getMonth();
  const d = new Date(iso);
  return d.getFullYear() * 12 + d.getMonth() === m;
}

function studentStartDate(s: Student) {
  return s.registered_at ?? s.created_at.slice(0, 10);
}

function isEnrolledAt(s: Student, at: string) {
  if (s.enrollment_status === 'prospect') return false;
  const start = studentStartDate(s);
  if (start > at) return false;
  if (s.withdrawn_at && s.withdrawn_at <= at) return false;
  if (s.enrollment_status === 'graduated' && s.withdrawn_at && s.withdrawn_at <= at) return false;
  return true;
}

function activeCountAt(students: Student[], at: string) {
  return students.filter((s) => isEnrolledAt(s, at) && ACTIVE_STATUSES.has(s.enrollment_status)).length;
}

function buildMonthTrend(students: Student[], months: number): GrowthTrendPoint[] {
  const points: GrowthTrendPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = monthEnd(ref);
    const endStr = toDateStr(end);
    const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
    const label = `${ref.getMonth() + 1}월`;
    points.push({
      key,
      label,
      total: activeCountAt(students, endStr),
      newRegistrations: students.filter((s) => inMonth(studentStartDate(s), ref)).length,
      withdrawals: students.filter(
        (s) => s.withdrawn_at && inMonth(s.withdrawn_at, ref)
      ).length,
    });
  }
  return points;
}

function normalizeChurnReason(raw: string | null | undefined): string {
  if (!raw?.trim()) return '기타';
  const t = raw.trim().toLowerCase();
  if (t.includes('이사') || t.includes('전학')) return '이사';
  if (t.includes('타') || t.includes('이동') || t.includes('학원')) return '타 학원 이동';
  if (t.includes('성적') || t.includes('점수')) return '성적';
  if (t.includes('비용') || t.includes('학비') || t.includes('가격')) return '비용';
  return raw.trim().slice(0, 24);
}

function longAbsenceIds(students: Student[], logs: LessonLog[], days = 14) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = toDateStr(cutoff);
  const lastLog = new Map<string, string>();
  for (const l of logs) {
    const prev = lastLog.get(l.student_id);
    if (!prev || l.lesson_date > prev) lastLog.set(l.student_id, l.lesson_date);
  }
  return students
    .filter((s) => s.enrollment_status === 'active')
    .filter((s) => {
      const last = lastLog.get(s.id);
      return !last || last < cutoffStr;
    })
    .map((s) => s.id);
}

function buildInsights(input: {
  students: Student[];
  trend6: GrowthTrendPoint[];
  reregPending: number;
  counselingGap: number;
  retentionSignals: RetentionSignal[];
  classes: { id: string; name: string; grade: string }[];
}): string[] {
  const lines: string[] = [];
  const { students, trend6, reregPending, counselingGap, retentionSignals, classes } = input;

  if (trend6.length >= 2) {
    const last = trend6[trend6.length - 1];
    const prev = trend6[trend6.length - 2];
    if (last.total > prev.total) {
      lines.push(`이번 달 학생 수는 지난달보다 ${last.total - prev.total}명 늘었습니다.`);
    } else if (last.total < prev.total) {
      lines.push(`이번 달 학생 수가 지난달보다 ${prev.total - last.total}명 줄었습니다.`);
    }
  }

  const thisMonthNew = students.filter((s) => inMonth(studentStartDate(s)));
  const byGrade = new Map<string, number>();
  for (const s of thisMonthNew) {
    byGrade.set(s.grade, (byGrade.get(s.grade) ?? 0) + 1);
  }
  const topGrade = [...byGrade.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topGrade && topGrade[1] >= 2) {
    lines.push(`${topGrade[0]} 신규 등록이 이번 달 가장 많습니다 (${topGrade[1]}명).`);
  }

  const byClass = new Map<string, number>();
  for (const s of thisMonthNew) {
    if (!s.class_id) continue;
    const c = classes.find((x) => x.id === s.class_id);
    const name = c?.name ?? '반';
    byClass.set(name, (byClass.get(name) ?? 0) + 1);
  }
  const topClass = [...byClass.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topClass && topClass[1] >= 2 && !lines.some((l) => l.includes(topClass[0]))) {
    lines.push(`${topClass[0]}반 신규 등록이 두드러집니다.`);
  }

  const gradeRereg = retentionSignals.filter((r) => r.risk_level === 'high' || r.risk_level === 'medium');
  if (gradeRereg.length >= 3) {
    const g = gradeRereg[0].students?.grade;
    if (g) lines.push(`${g} 재등록 검토가 필요한 학생이 있습니다.`);
  }

  if (reregPending > 0 && counselingGap > 0) {
    lines.push(`재등록 예정 ${reregPending}명 중 상담 기록이 없는 학생이 ${counselingGap}명 있습니다.`);
  } else if (reregPending > 0) {
    lines.push(`재등록 예정 학생 ${reregPending}명 — 이번 주 상담을 권장합니다.`);
  }

  if (lines.length === 0) {
    lines.push('학생 수와 등록 흐름이 안정적입니다. 오늘은 상담·출결 점검에 집중하세요.');
  }

  return lines.slice(0, 4);
}

function buildAiReport(metrics: Omit<StudentGrowthMetrics, 'aiReport' | 'prediction'>): string[] {
  const lines = [...metrics.insights];
  if (metrics.monthlyChanges.withdrawals >= 3) {
    lines.push(`이번 달 퇴원 ${metrics.monthlyChanges.withdrawals}명 — 이탈 사유를 점검해 보세요.`);
  }
  if (metrics.reregistration.rate > 0 && metrics.reregistration.rate < 70) {
    lines.push(`재등록률 ${metrics.reregistration.rate}%로, 예정 학생 상담이 필요합니다.`);
  }
  if (metrics.attention.longAbsence > 0) {
    lines.push(`장기 결석 ${metrics.attention.longAbsence}명 — 연락·상담을 우선 확인하세요.`);
  }
  return [...new Set(lines)].slice(0, 5);
}

function buildPrediction(
  current: number,
  trend6: GrowthTrendPoint[],
  atRisk: number,
  reregRate: number
): StudentGrowthMetrics['prediction'] {
  const nets = trend6.slice(-3).map((p, i, arr) => {
    if (i === 0) return 0;
    return p.total - arr[i - 1].total;
  });
  const avgNet = nets.length ? Math.round(nets.reduce((a, b) => a + b, 0) / nets.length) : 0;
  const nextMonth = Math.max(0, current + avgNet);
  const rationale: string[] = [];
  if (nets.length) rationale.push(`최근 3개월 평균 순증 ${avgNet >= 0 ? '+' : ''}${avgNet}명`);
  if (reregRate > 0) rationale.push(`재등록 진행률 ${reregRate}%`);
  if (atRisk > 0) rationale.push(`재등록·출결 확인 권장 ${atRisk}명`);
  rationale.push('출결·숙제·상담 이력 반영');
  return {
    current,
    nextMonth,
    netDelta: nextMonth - current,
    atRisk,
    rationale,
  };
}

export function computeStudentGrowth(input: {
  students: Student[];
  logs: LessonLog[];
  reregistrationRecords: ReregistrationRecord[];
  retentionSignals: RetentionSignal[];
  counselingSessions: Pick<CounselingSession, 'student_id' | 'status'>[];
  consultationCards: Pick<ConsultationCard, 'student_id' | 'consultation_status'>[];
  classes: { id: string; name: string; grade: string; teacher_id: string | null }[];
  teacherNames: Map<string, string>;
}): StudentGrowthMetrics {
  const { students, logs, reregistrationRecords, retentionSignals, counselingSessions, consultationCards, classes, teacherNames } =
    input;

  const activeStudents = students.filter((s) => s.enrollment_status === 'active');
  const currentCount = activeStudents.length;

  const prevEnd = monthEnd(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const prevMonthCount = activeCountAt(students, toDateStr(prevEnd));
  const monthDelta = currentCount - prevMonthCount;
  const monthDeltaPct = prevMonthCount > 0 ? Math.round((monthDelta / prevMonthCount) * 1000) / 10 : 0;

  const monthlyChanges = {
    newRegistrations: students.filter(
      (s) => inMonth(studentStartDate(s)) && s.enrollment_status !== 'prospect'
    ).length,
    reregistrations: reregistrationRecords.filter(
      (r) => r.status === 'confirmed' && (inMonth(r.decided_at) || inMonth(r.updated_at.slice(0, 10)))
    ).length,
    onLeave: students.filter((s) => s.enrollment_status === 'on_leave').length,
    withdrawals: students.filter((s) => s.withdrawn_at && inMonth(s.withdrawn_at)).length,
  };

  const pendingRereg = reregistrationRecords.filter((r) =>
    ['pending', 'contacted', 'deferred'].includes(r.status)
  );
  const pendingReregStudentIds = pendingRereg.map((r) => r.student_id);

  const counseledStudentIds = new Set([
    ...counselingSessions
      .filter((s) => s.status === 'completed' || s.status === 'followup_needed')
      .map((s) => s.student_id),
    ...consultationCards
      .filter((c) => c.consultation_status === 'completed')
      .map((c) => c.student_id),
  ]);
  const counselingIncompleteStudentIds = pendingRereg
    .filter((r) => !counseledStudentIds.has(r.student_id))
    .map((r) => r.student_id);

  const longAbsenceStudentIds = longAbsenceIds(students, logs);

  const reregTotal = reregistrationRecords.length || pendingRereg.length + reregistrationRecords.filter((r) => r.status === 'confirmed').length;
  const reregCompleted = reregistrationRecords.filter((r) => r.status === 'confirmed').length;
  const reregPending = pendingRereg.length;
  const reregIncomplete = reregistrationRecords.filter((r) => r.status === 'declined').length;
  const reregDenom = reregCompleted + reregPending + reregIncomplete;
  const reregRate = reregDenom > 0 ? Math.round((reregCompleted / reregDenom) * 100) : 0;

  const trend6 = buildMonthTrend(students, 6);
  const trend12 = buildMonthTrend(students, 12);

  const thisMonthNew = students.filter((s) => inMonth(studentStartDate(s)));
  const gradeMap = new Map<string, number>();
  const classMap = new Map<string, number>();
  const teacherMap = new Map<string, number>();
  for (const s of thisMonthNew) {
    gradeMap.set(s.grade, (gradeMap.get(s.grade) ?? 0) + 1);
    const cls = classes.find((c) => c.id === s.class_id);
    if (cls) {
      classMap.set(cls.name, (classMap.get(cls.name) ?? 0) + 1);
      if (cls.teacher_id) {
        const tname = teacherNames.get(cls.teacher_id) ?? '담당 교사';
        teacherMap.set(tname, (teacherMap.get(tname) ?? 0) + 1);
      }
    }
  }

  const churnMap = new Map<string, number>();
  for (const s of students.filter((x) => x.withdrawn_at && inMonth(x.withdrawn_at))) {
    const reason = normalizeChurnReason(s.withdrawal_reason);
    churnMap.set(reason, (churnMap.get(reason) ?? 0) + 1);
  }

  const atRisk =
    retentionSignals.filter((r) => r.risk_level === 'high' || r.risk_level === 'medium').length +
    counselingIncompleteStudentIds.length;

  const insights = buildInsights({
    students,
    trend6,
    reregPending: reregPending,
    counselingGap: counselingIncompleteStudentIds.length,
    retentionSignals,
    classes,
  });

  const base = {
    currentCount,
    prevMonthCount,
    monthDelta,
    monthDeltaPct,
    monthlyChanges,
    attention: {
      reregistrationPending: reregPending,
      longAbsence: longAbsenceStudentIds.length,
      counselingIncomplete: counselingIncompleteStudentIds.length,
    },
    insights,
    trend6,
    trend12,
    netGrowthThisMonth:
      monthlyChanges.newRegistrations + monthlyChanges.reregistrations - monthlyChanges.withdrawals,
    reregistration: {
      total: reregDenom,
      completed: reregCompleted,
      pending: reregPending,
      incomplete: reregIncomplete,
      rate: reregRate,
    },
    newByGrade: [...gradeMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    newByClass: [...classMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    newByTeacher: [...teacherMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    churnReasons: [...churnMap.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    pendingReregStudentIds,
    longAbsenceStudentIds,
    counselingIncompleteStudentIds,
  };

  return {
    ...base,
    aiReport: buildAiReport(base),
    prediction: buildPrediction(currentCount, trend6, atRisk, reregRate),
  };
}
