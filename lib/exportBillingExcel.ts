import { paymentOverdue } from '@/lib/retentionPrediction';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';
import type { PaymentStatus } from '@/types/database';

function escapeCell(v: string | number | null | undefined) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function statusLabel(row: EnrichedPaymentRow, today: string): string {
  const p = row.payment;
  if (p.status === 'paid') return '완납';
  if (p.status === 'waived') return '면제';
  if (paymentOverdue(p, today)) return '연체';
  return '미납';
}

export function buildBillingExportRows(rows: EnrichedPaymentRow[], today: string) {
  const header = [
    '학생',
    '학년',
    '반',
    '청구명',
    '청구월',
    '금액',
    '납부기한',
    '상태',
    '완납일',
    '최근상담',
    '재등록예정',
    '다음달청구여부',
  ];

  const body = rows.map((r) => [
    r.studentName,
    r.grade,
    r.className,
    r.payment.title,
    r.payment.billing_month ?? '',
    r.payment.amount,
    r.payment.due_date,
    statusLabel(r, today),
    r.payment.paid_at?.slice(0, 10) ?? '',
    r.hasRecentCounseling ? 'Y' : 'N',
    r.reregistrationPending ? 'Y' : 'N',
    r.hasNextMonthBilling ? 'Y' : 'N',
  ]);

  return [header, ...body];
}

export function downloadBillingExcel(
  rows: EnrichedPaymentRow[],
  today: string,
  filename?: string
) {
  const data = buildBillingExportRows(rows, today);
  const csv = data.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const month = today.slice(0, 7);
  a.href = url;
  a.download = filename ?? `수강료_청구목록_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
