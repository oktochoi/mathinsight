'use client';

import { paymentOverdue } from '@/lib/retentionPrediction';
import type { StudentPayment } from '@/types/database';
import { cn } from '@/lib/cn';

const STATUS_LABELS: Record<StudentPayment['status'], string> = {
  pending: '미납',
  paid: '완납',
  overdue: '연체',
  waived: '면제',
};

export function ParentPaymentsPanel({
  payments,
  loading,
}: {
  payments: StudentPayment[];
  loading: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = payments.filter((p) => paymentOverdue(p, today));

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-stone-500">불러오는 중…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-stone-500">등록된 청구 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {overdue.length > 0 && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              납부 기한이 지난 청구 {overdue.length}건이 있습니다. 학원에 문의해 주세요.
            </p>
          )}
          <ul className="space-y-2">
            {payments.slice(0, 6).map((p) => {
              const isOverdue = paymentOverdue(p, today);
              const status = isOverdue && p.status === 'pending' ? 'overdue' : p.status;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 px-3 py-2.5 bg-white"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{p.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {p.amount.toLocaleString('ko-KR')}원 · 기한 {p.due_date}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      status === 'paid' && 'bg-emerald-50 text-emerald-800',
                      status === 'pending' && 'bg-amber-50 text-amber-900',
                      status === 'overdue' && 'bg-rose-50 text-rose-800',
                      status === 'waived' && 'bg-stone-100 text-stone-600'
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
