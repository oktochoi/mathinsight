'use client';

import Link from 'next/link';
import { suggestNextMonthBilling } from '@/lib/billingOperations';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

/** 완납 후 다음 단계 — 모달 대신 지속 배너 */
export function PaidFollowUpBanner({
  row,
  busy,
  onCreateNextMonth,
  onRegisterRereg,
  onDismiss,
}: {
  row: EnrichedPaymentRow;
  busy?: boolean;
  onCreateNextMonth: () => void;
  onRegisterRereg: () => void;
  onDismiss: () => void;
}) {
  const suggestion = suggestNextMonthBilling(row.payment);

  return (
    <div
      className="rounded-2xl px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        background: 'var(--app-success-bg)',
        border: '1px solid var(--app-success-border)',
      }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <i className="ri-check-line text-lg" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--app-success-text)' }}>
            {row.studentName} 완납 처리됨
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-2)' }}>
            {row.payment.title} · {formatAmount(row.payment.amount)} — 다음 단계를 진행할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {!row.hasNextMonthBilling && (
          <button
            type="button"
            disabled={busy}
            onClick={onCreateNextMonth}
            className="app-btn app-btn-primary text-xs disabled:opacity-50"
          >
            {suggestion.monthLabel} 청구
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onRegisterRereg}
          className="app-btn app-btn-secondary text-xs disabled:opacity-50"
        >
          재등록 예정
        </button>
        <Link
          href={`/counseling?student=${row.payment.student_id}&type=reregistration`}
          className="app-btn app-btn-ghost text-xs"
        >
          상담 예약
        </Link>
        <button type="button" onClick={onDismiss} className="text-xs px-2" style={{ color: 'var(--app-ink-3)' }}>
          닫기
        </button>
      </div>
    </div>
  );
}
