import { paymentOverdue } from '@/lib/retentionPrediction';
import type { CounselingSession, ReregistrationRecord, Student, StudentPayment } from '@/types/database';

export type BillingKpis = {
  collectedThisMonth: number;
  collectedPrevMonth: number;
  collectedMonthDeltaPct: number;
  outstanding: number;
  outstandingStudentCount: number;
  todayCollected: number;
  todayCollectedCount: number;
  dueNext7Days: number;
  dueNext7DaysCount: number;
  overdueStudentCount: number;
  aiRiskCount: number;
};

export type PaymentTimelinePoint = {
  key: string;
  label: string;
  billed: number;
  collected: number;
  outstanding: number;
};

export type BillingTodayTask = {
  id: string;
  label: string;
  count: number;
  filterKey: BillingListFilter;
};

export type BillingListFilter =
  | 'all'
  | 'pending'
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'due_today'
  | 'overdue_14'
  | 'rereg_unpaid'
  | 'notify_needed';

export type EnrichedPaymentRow = {
  payment: StudentPayment;
  studentName: string;
  grade: string;
  classId: string | null;
  className: string;
  hasRecentCounseling: boolean;
  reregistrationPending: boolean;
  daysOverdue: number;
  isOverdue: boolean;
  hasNextMonthBilling: boolean;
  nextMonthKey: string;
};

export type NextMonthBillingSuggestion = {
  title: string;
  billing_month: string;
  due_date: string;
  amount: number;
  monthLabel: string;
};

export type ClassCollectionRate = {
  classId: string;
  className: string;
  rate: number;
  paidAmount: number;
  totalAmount: number;
  studentCount: number;
};

export type BillingForecast = {
  collectedSoFar: number;
  expectedMonthRevenue: number;
  expectedOutstanding: number;
  nextMonthExpected: number;
  rationale: string[];
};

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthKey(d = new Date()) {
  const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return monthKey(p);
}

function paidInMonth(p: StudentPayment, key: string) {
  if (p.status !== 'paid' || !p.paid_at) return false;
  return p.paid_at.slice(0, 7) === key;
}

function paymentMonth(p: StudentPayment) {
  return p.billing_month ?? p.due_date.slice(0, 7);
}

export function addMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string) {
  const m = Number(key.split('-')[1]);
  return `${m}월`;
}

export function suggestNextMonthBilling(payment: StudentPayment): NextMonthBillingSuggestion {
  const current = paymentMonth(payment);
  const billing_month = addMonthKey(current);
  const m = Number(billing_month.split('-')[1]);
  const monthLabelStr = `${m}월`;
  const titleMatch = payment.title.match(/(\d+)월/);
  const title = titleMatch
    ? payment.title.replace(titleMatch[0], monthLabelStr)
    : `${monthLabelStr} 수강료`;
  const due_date = `${billing_month}-05`;
  return {
    title,
    billing_month,
    due_date,
    amount: payment.amount,
    monthLabel: monthLabelStr,
  };
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

export function formatWon(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

export function computeBillingKpis(payments: StudentPayment[], today: string): BillingKpis {
  const thisM = monthKey();
  const prevM = prevMonthKey();

  const collectedThisMonth = payments
    .filter((p) => paidInMonth(p, thisM))
    .reduce((s, p) => s + p.amount, 0);
  const collectedPrevMonth = payments
    .filter((p) => paidInMonth(p, prevM))
    .reduce((s, p) => s + p.amount, 0);
  const collectedMonthDeltaPct =
    collectedPrevMonth > 0
      ? Math.round(((collectedThisMonth - collectedPrevMonth) / collectedPrevMonth) * 1000) / 10
      : 0;

  const pending = payments.filter((p) => p.status === 'pending');
  const outstanding = pending.reduce((s, p) => s + p.amount, 0);
  const outstandingStudentCount = new Set(pending.map((p) => p.student_id)).size;

  const todayPaid = payments.filter(
    (p) => p.status === 'paid' && p.paid_at && p.paid_at.slice(0, 10) === today
  );
  const todayCollected = todayPaid.reduce((s, p) => s + p.amount, 0);

  const in7 = addDays(today, 7);
  const dueSoon = pending.filter((p) => p.due_date >= today && p.due_date <= in7);
  const dueNext7Days = dueSoon.reduce((s, p) => s + p.amount, 0);

  const aiRiskCount = pending.filter((p) => {
    const overdue = paymentOverdue(p, today);
    const days = overdue ? daysBetween(p.due_date, today) : 0;
    return overdue && days >= 7;
  }).length;

  const overdueStudentCount = new Set(
    pending.filter((p) => paymentOverdue(p, today)).map((p) => p.student_id)
  ).size;

  return {
    collectedThisMonth,
    collectedPrevMonth,
    collectedMonthDeltaPct,
    outstanding,
    outstandingStudentCount,
    todayCollected,
    todayCollectedCount: todayPaid.length,
    dueNext7Days,
    dueNext7DaysCount: dueSoon.length,
    overdueStudentCount,
    aiRiskCount,
  };
}

export function buildPaymentTimeline(payments: StudentPayment[]): PaymentTimelinePoint[] {
  const thisM = monthKey();
  const monthPayments = payments.filter((p) => paymentMonth(p) === thisM);
  const lastDay = new Date().getDate();

  const points: PaymentTimelinePoint[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${thisM}-${String(d).padStart(2, '0')}`;

    const cumBilled = monthPayments
      .filter((p) => p.created_at.slice(0, 10) <= dateStr)
      .reduce((s, p) => s + p.amount, 0);

    const cumCollected = monthPayments
      .filter((p) => p.status === 'paid' && p.paid_at && p.paid_at.slice(0, 10) <= dateStr)
      .reduce((s, p) => s + p.amount, 0);

    const outstanding = monthPayments
      .filter((p) => p.status === 'pending' && p.due_date <= dateStr)
      .reduce((s, p) => s + p.amount, 0);

    points.push({
      key: String(d),
      label: `${d}일`,
      billed: cumBilled,
      collected: cumCollected,
      outstanding,
    });
  }

  if (points.length === 0) {
    points.push({ key: '1', label: '1일', billed: 0, collected: 0, outstanding: 0 });
  }
  return points;
}

export function buildBillingTodayTasks(
  rows: EnrichedPaymentRow[],
  today: string
): BillingTodayTask[] {
  const dueToday = rows.filter(
    (r) => r.payment.status === 'pending' && r.payment.due_date === today
  );
  const pendingStudents = new Set(
    rows.filter((r) => r.payment.status === 'pending').map((r) => r.payment.student_id)
  );
  const overdueStudents = new Set(
    rows.filter((r) => r.isOverdue).map((r) => r.payment.student_id)
  );
  const overdue14 = rows.filter((r) => r.isOverdue && r.daysOverdue >= 14);
  const reregUnpaid = rows.filter((r) => r.reregistrationPending && r.payment.status === 'pending');
  const notifyNeeded = rows.filter((r) => r.isOverdue && r.daysOverdue >= 3);

  const tasks: BillingTodayTask[] = [];
  if (dueToday.length)
    tasks.push({ id: 'due_today', label: '오늘 납부 예정', count: dueToday.length, filterKey: 'due_today' });
  if (pendingStudents.size > 0)
    tasks.push({
      id: 'pending',
      label: '미납 학생',
      count: pendingStudents.size,
      filterKey: 'unpaid',
    });
  if (overdueStudents.size > 0)
    tasks.push({
      id: 'overdue',
      label: '연체 학생',
      count: overdueStudents.size,
      filterKey: 'overdue',
    });
  if (overdue14.length)
    tasks.push({
      id: 'overdue_14',
      label: '장기 연체 (14일+)',
      count: new Set(overdue14.map((r) => r.payment.student_id)).size,
      filterKey: 'overdue_14',
    });
  if (reregUnpaid.length)
    tasks.push({
      id: 'rereg_unpaid',
      label: '재등록 예정인데 미납',
      count: reregUnpaid.length,
      filterKey: 'rereg_unpaid',
    });
  if (notifyNeeded.length)
    tasks.push({
      id: 'notify_needed',
      label: '문자 발송 필요',
      count: notifyNeeded.length,
      filterKey: 'notify_needed',
    });
  return tasks;
}

export function enrichPaymentRows(
  payments: StudentPayment[],
  students: Student[],
  classes: { id: string; name: string; grade: string }[],
  counseling: Pick<CounselingSession, 'student_id' | 'status' | 'completed_at'>[],
  reregRecords: ReregistrationRecord[],
  today: string
): EnrichedPaymentRow[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const cutoff = addDays(today, -60);

  const counseledRecently = new Set(
    counseling
      .filter(
        (s) =>
          (s.status === 'completed' || s.status === 'followup_needed') &&
          s.completed_at &&
          s.completed_at.slice(0, 10) >= cutoff
      )
      .map((s) => s.student_id)
  );

  const reregPending = new Set(
    reregRecords
      .filter((r) => ['pending', 'contacted', 'deferred'].includes(r.status))
      .map((r) => r.student_id)
  );

  const nextMonthByStudent = new Map<string, Set<string>>();
  for (const p of payments) {
    const key = paymentMonth(p);
    const set = nextMonthByStudent.get(p.student_id) ?? new Set();
    set.add(key);
    nextMonthByStudent.set(p.student_id, set);
  }

  return payments.map((payment) => {
    const st = studentMap.get(payment.student_id);
    const cls = st?.class_id ? classMap.get(st.class_id) : undefined;
    const isOverdue = paymentOverdue(payment, today);
    const daysOverdue = isOverdue ? daysBetween(payment.due_date, today) : 0;
    const nextMonthKey = addMonthKey(paymentMonth(payment));
    const studentMonths = nextMonthByStudent.get(payment.student_id);
    const hasNextMonthBilling = studentMonths?.has(nextMonthKey) ?? false;
    return {
      payment,
      studentName: st?.name ?? payment.students?.name ?? '학생',
      grade: st?.grade ?? payment.students?.grade ?? '',
      classId: st?.class_id ?? null,
      className: cls?.name ?? '반 미지정',
      hasRecentCounseling: counseledRecently.has(payment.student_id),
      reregistrationPending: reregPending.has(payment.student_id),
      daysOverdue,
      isOverdue,
      hasNextMonthBilling,
      nextMonthKey,
    };
  });
}

export function filterEnrichedRows(
  rows: EnrichedPaymentRow[],
  filter: BillingListFilter,
  today: string
): EnrichedPaymentRow[] {
  switch (filter) {
    case 'pending':
      return rows.filter((r) => r.payment.status === 'pending' && !r.isOverdue);
    case 'unpaid':
      return rows.filter((r) => r.payment.status === 'pending');
    case 'paid':
      return rows.filter((r) => r.payment.status === 'paid');
    case 'overdue':
      return rows.filter((r) => r.isOverdue);
    case 'due_today':
      return rows.filter((r) => r.payment.status === 'pending' && r.payment.due_date === today);
    case 'overdue_14':
      return rows.filter((r) => r.isOverdue && r.daysOverdue >= 14);
    case 'rereg_unpaid':
      return rows.filter((r) => r.reregistrationPending && r.payment.status === 'pending');
    case 'notify_needed':
      return rows.filter((r) => r.isOverdue && r.daysOverdue >= 3);
    default:
      return rows;
  }
}

export function computeClassCollectionRates(rows: EnrichedPaymentRow[]): ClassCollectionRate[] {
  const thisM = monthKey();
  const monthRows = rows.filter((r) => paymentMonth(r.payment) === thisM);
  const byClass = new Map<string, EnrichedPaymentRow[]>();

  for (const r of monthRows) {
    const id = r.classId ?? '_none';
    const list = byClass.get(id) ?? [];
    list.push(r);
    byClass.set(id, list);
  }

  const rates: ClassCollectionRate[] = [];
  for (const [classId, list] of byClass) {
    const totalAmount = list.reduce((s, r) => s + r.payment.amount, 0);
    const paidAmount = list
      .filter((r) => r.payment.status === 'paid')
      .reduce((s, r) => s + r.payment.amount, 0);
    const rate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100;
    rates.push({
      classId,
      className: list[0]?.className ?? '반 미지정',
      rate,
      paidAmount,
      totalAmount,
      studentCount: new Set(list.map((r) => r.payment.student_id)).size,
    });
  }

  return rates.sort((a, b) => a.rate - b.rate);
}

export function buildBillingInsights(
  rows: EnrichedPaymentRow[],
  classRates: ClassCollectionRate[],
  kpis: BillingKpis
): string[] {
  const lines: string[] = [];

  if (kpis.collectedMonthDeltaPct < -5) {
    lines.push('이번 달 수납이 지난달보다 줄었습니다. 미납 학생 연락을 우선 확인하세요.');
  } else if (kpis.collectedMonthDeltaPct > 5) {
    lines.push(`이번 달 수납이 지난달보다 ${kpis.collectedMonthDeltaPct}% 증가했습니다.`);
  }

  const withAmount = classRates.filter((c) => c.totalAmount > 0);
  const worstClass = [...withAmount].sort((a, b) => a.rate - b.rate)[0];
  const bestClass = [...withAmount].sort((a, b) => b.rate - a.rate)[0];
  if (worstClass && worstClass.rate < 90) {
    lines.push(`${worstClass.className}반 수납률 ${worstClass.rate}%로 가장 낮습니다.`);
  }
  if (bestClass && bestClass.rate >= 95 && bestClass.className !== worstClass?.className) {
    lines.push(`${bestClass.className}반은 이번 달 수납률이 ${bestClass.rate}%로 가장 높습니다.`);
  }

  const longOverdueNoCounsel = rows.filter(
    (r) => r.isOverdue && r.daysOverdue >= 14 && !r.hasRecentCounseling
  );
  if (longOverdueNoCounsel.length > 0) {
    lines.push(`장기 미납 학생 ${longOverdueNoCounsel.length}명 중 최근 상담 기록이 없습니다.`);
  }

  const reregUnpaid = rows.filter((r) => r.reregistrationPending && r.payment.status === 'pending');
  if (reregUnpaid.length > 0) {
    lines.push(`재등록 예정 학생 ${reregUnpaid.length}명이 아직 미납 상태입니다.`);
  }

  if (lines.length === 0) {
    lines.push('수납 흐름이 안정적입니다. 오늘 납부 예정 건만 확인하세요.');
  }

  return lines.slice(0, 4);
}

export function buildBillingForecast(
  payments: StudentPayment[],
  kpis: BillingKpis,
  activeStudentCount: number
): BillingForecast {
  const thisM = monthKey();
  const monthPending = payments.filter(
    (p) => p.status === 'pending' && paymentMonth(p) === thisM
  );
  const expectedOutstanding = monthPending.reduce((s, p) => s + p.amount, 0);
  const expectedMonthRevenue = kpis.collectedThisMonth + expectedOutstanding;

  const paidMonths = new Set(
    payments.filter((p) => p.status === 'paid').map((p) => paymentMonth(p))
  );
  const avgMonthly =
    payments.filter((p) => p.status === 'paid').length > 0
      ? Math.round(
          payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) /
            Math.max(1, paidMonths.size)
        )
      : 0;

  const nextMonthExpected = Math.round(
    kpis.collectedThisMonth * 0.7 + avgMonthly * Math.max(1, activeStudentCount) * 0.3
  );

  return {
    collectedSoFar: kpis.collectedThisMonth,
    expectedMonthRevenue,
    expectedOutstanding,
    nextMonthExpected,
    rationale: [
      `이번 달 청구·수납 ${payments.filter((p) => paymentMonth(p) === thisM).length}건`,
      `미수금 ${formatWon(expectedOutstanding)}`,
      `재원 학생 ${activeStudentCount}명 기준 월 패턴`,
      '최근 수납 추세 반영',
    ],
  };
}

export function buildStudentBillingSummary(
  studentName: string,
  payments: StudentPayment[],
  hasRereg: boolean,
  counselingCount: number,
  today: string
): string {
  const pending = payments.filter((p) => p.status === 'pending');
  const overdue = pending.filter((p) => paymentOverdue(p, today));
  const parts: string[] = [];
  if (overdue.length > 0) {
    parts.push(
      `${studentName} 학생은 미납 ${overdue.length}건(연체 ${formatWon(overdue.reduce((s, p) => s + p.amount, 0))}).`
    );
  } else if (pending.length > 0) {
    parts.push(`미납 ${pending.length}건이 있습니다.`);
  } else {
    parts.push('현재 미납 청구가 없습니다.');
  }
  if (hasRereg) parts.push('재등록 예정 상태입니다.');
  if (counselingCount === 0 && overdue.length > 0) {
    parts.push('최근 상담 기록이 없어 연락·상담을 권장합니다.');
  }
  return parts.join(' ');
}
