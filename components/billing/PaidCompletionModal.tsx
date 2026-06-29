'use client';

import Link from 'next/link';
import { suggestNextMonthBilling } from '@/lib/billingOperations';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export function PaidCompletionModal({
  row,
  busy,
  onCreateNextMonth,
  onRegisterRereg,
  onClose,
}: {
  row: EnrichedPaymentRow | null;
  busy?: boolean;
  onCreateNextMonth: () => void;
  onRegisterRereg: () => void;
  onClose: () => void;
}) {
  if (!row) return null;

  const suggestion = suggestNextMonthBilling(row.payment);

  return (
    <>
      <button
        type="button"
        aria-label="닫기"
        className="fixed inset-0 z-50 bg-slate-900/40"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl p-6 mx-4" style={{ background: 'var(--app-surface)' }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <i className="ri-check-line text-xl" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--app-ink)' }}>완납 처리됨</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--app-ink-2)' }}>
              <span className="font-semibold">{row.studentName}</span> · {row.payment.title}{' '}
              <span className="tabular-nums">{formatAmount(row.payment.amount)}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--app-ink)' }}>다음 단계</p>
          <p>
            완납 후에는 보통 <span className="font-semibold">{suggestion.monthLabel} 수강료 청구</span>
            와 재등록 확인을 진행합니다.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {!row.hasNextMonthBilling ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCreateNextMonth}
              className="w-full py-3 app-btn app-btn-primary disabled:opacity-50"
            >
              {suggestion.monthLabel} 수강료 청구 ({formatAmount(suggestion.amount)})
            </button>
          ) : (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {suggestion.monthLabel} 청구가 이미 등록되어 있습니다.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onRegisterRereg}
            className="w-full py-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-900 text-sm font-semibold disabled:opacity-50"
          >
            재등록 예정으로 등록
          </button>
          <Link
            href={`/counseling?student=${row.payment.student_id}&type=reregistration`}
            className="w-full py-3 rounded-xl text-center text-sm font-medium transition-colors hover:bg-[var(--app-surface-2)]"
            style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
          >
            재등록 상담 예약
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm transition-colors"
            style={{ color: 'var(--app-ink-3)' }}
          >
            나중에 하기
          </button>
        </div>
      </div>
    </>
  );
}
