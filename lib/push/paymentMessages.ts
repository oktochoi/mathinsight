import type { StudentPayment } from '@/types/database';
import { formatAmountKrw, formatKoreanDate } from '@/lib/push/pushDates';

export function buildPaymentCreatedMessage(
  payment: Pick<StudentPayment, 'title' | 'amount' | 'due_date'>,
  studentName: string,
  academyName?: string
): { title: string; body: string } {
  const academy = academyName?.trim() || '학원';
  return {
    title: '수강료 청구 안내',
    body: `${studentName} 학생 ${payment.title} ${formatAmountKrw(payment.amount)}이 청구되었습니다. 납부 기한은 ${formatKoreanDate(payment.due_date)}입니다. (${academy})`,
  };
}

export function buildPaymentPaidMessage(
  payment: Pick<StudentPayment, 'title' | 'amount'>,
  studentName: string,
  academyName?: string
): { title: string; body: string } {
  const academy = academyName?.trim() || '학원';
  return {
    title: '납부 확인',
    body: `${studentName} 학생 ${payment.title} ${formatAmountKrw(payment.amount)} 납부가 확인되었습니다. (${academy})`,
  };
}

export function buildPaymentDueSoonMessage(
  payment: Pick<StudentPayment, 'title' | 'amount' | 'due_date'>,
  studentName: string,
  daysLeft: number,
  academyName?: string
): { title: string; body: string } {
  const academy = academyName?.trim() || '학원';
  return {
    title: '수강료 납부 안내',
    body: `${studentName} 학생 ${payment.title} ${formatAmountKrw(payment.amount)} 납부 기한이 ${daysLeft}일 남았습니다. (${formatKoreanDate(payment.due_date)} · ${academy})`,
  };
}

export function buildPaymentOverdueMessage(
  payment: Pick<StudentPayment, 'title' | 'amount' | 'due_date'>,
  studentName: string,
  academyName?: string
): { title: string; body: string } {
  const academy = academyName?.trim() || '학원';
  return {
    title: '수강료 미납 안내',
    body: `${studentName} 학생 ${payment.title} ${formatAmountKrw(payment.amount)}이 미납 상태입니다. (${formatKoreanDate(payment.due_date)} 기한 · ${academy})`,
  };
}
