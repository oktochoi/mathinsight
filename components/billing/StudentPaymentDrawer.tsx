'use client';

import Link from 'next/link';
import { paymentOverdue } from '@/lib/retentionPrediction';
import { monthLabel, suggestNextMonthBilling } from '@/lib/billingOperations';
import type { CounselingSession, StudentPayment } from '@/types/database';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export function StudentPaymentDrawer({
  open,
  row,
  payments,
  counseling,
  hasRereg,
  aiSummary,
  onClose,
  onMarkPaid,
  onRegisterNextMonth,
  onRegisterRereg,
}: {
  open: boolean;
  row: EnrichedPaymentRow | null;
  payments: StudentPayment[];
  counseling: CounselingSession[];
  hasRereg: boolean;
  aiSummary: string;
  onClose: () => void;
  onMarkPaid: (paymentId: string) => void;
  onRegisterNextMonth: () => void;
  onRegisterRereg: () => void;
}) {
  if (!open || !row) return null;

  const { studentId, studentName, grade } = {
    studentId: row.payment.student_id,
    studentName: row.studentName,
    grade: row.grade,
  };

  const today = new Date().toISOString().slice(0, 10);
  const overdue = payments.filter((p) => paymentOverdue(p, today));
  const paid = payments.filter((p) => p.status === 'paid');
  const suggestion = suggestNextMonthBilling(row.payment);

  return (
    <>
      <button
        type="button"
        aria-label="닫기"
        className="app-overlay"
        onClick={onClose}
      />
      <aside className="app-drawer max-w-md">
        <header className="app-drawer-header">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--app-ink-4)' }}>
              수납 상세
            </p>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>
              {studentName}
            </h2>
            {grade && <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>{grade}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--app-surface-2)]"
            style={{ color: 'var(--app-ink-3)' }}
          >
            <i className="ri-close-line text-xl" />
          </button>
        </header>

        <div className="app-drawer-body space-y-6">
          {row.payment.status === 'paid' && !row.hasNextMonthBilling && (
            <div className="rounded-xl border-indigo-100 bg-indigo-50/50 p-4 space-y-2" style={{ border: '1px solid' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>다음 달 수강료</p>
              <p className="text-xs" style={{ color: 'var(--app-ink-2)' }}>
                {suggestion.monthLabel} · {formatAmount(suggestion.amount)} · 납부 {suggestion.due_date}
              </p>
              <button
                type="button"
                onClick={onRegisterNextMonth}
                className="w-full app-btn app-btn-primary"
              >
                {suggestion.monthLabel} 수강료 청구
              </button>
            </div>
          )}

          <div className="rounded-xl border-indigo-100 bg-indigo-50/40 px-4 py-3" style={{ border: '1px solid' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-1">
              AI 요약
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>{aiSummary}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {hasRereg && (
              <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-100">
                재등록 예정
              </span>
            )}
            {overdue.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                연체 {overdue.length}건
              </span>
            )}
            {row.hasNextMonthBilling && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                {monthLabel(row.nextMonthKey)} 청구됨
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegisterRereg}
              className="flex-1 py-2 rounded-xl border border-violet-200 text-violet-800 text-xs font-semibold hover:bg-violet-50"
            >
              재등록 예정 등록
            </button>
            <Link
              href={`/counseling?student=${studentId}&type=reregistration`}
              className="flex-1 py-2 rounded-xl text-center text-xs font-semibold transition-colors hover:bg-[var(--app-surface-2)]"
              style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
            >
              재등록 상담
            </Link>
          </div>

          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--app-ink)' }}>청구 이력</h3>
            <ul className="space-y-2">
              {payments.length === 0 ? (
                <li className="text-sm" style={{ color: 'var(--app-ink-3)' }}>청구 내역이 없습니다.</li>
              ) : (
                payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                    style={{ border: '1px solid var(--app-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--app-ink)' }}>{p.title}</p>
                      <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                        {formatAmount(p.amount)} · {p.due_date}
                      </p>
                    </div>
                    {p.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(p.id)}
                        className="text-xs px-2 py-1 rounded-lg app-btn app-btn-primary shrink-0"
                      >
                        완납
                      </button>
                    )}
                    {p.status === 'paid' && (
                      <span className="text-xs text-emerald-600 font-medium shrink-0">완납</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--app-ink)' }}>납부 이력</h3>
            {paid.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>납부 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-1.5">
                {paid.map((p) => (
                  <li key={p.id} className="text-sm flex justify-between" style={{ color: 'var(--app-ink-2)' }}>
                    <span>{p.title}</span>
                    <span className="tabular-nums">
                      {formatAmount(p.amount)}
                      {p.paid_at && (
                        <span className="text-xs ml-1" style={{ color: 'var(--app-ink-4)' }}>
                          {p.paid_at.slice(0, 10)}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {overdue.length > 0 && (
            <section>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--app-ink)' }}>연체 기록</h3>
              <ul className="space-y-1.5">
                {overdue.map((p) => (
                  <li key={p.id} className="text-sm text-rose-700">
                    {p.title} — {p.due_date} ({formatAmount(p.amount)})
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>상담 기록</h3>
              <Link
                href={`/counseling?student=${studentId}`}
                className="text-xs font-medium"
                style={{ color: 'var(--app-accent)' }}
              >
                상담 열기
              </Link>
            </div>
            {counseling.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>상담 기록이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {counseling.map((s) => (
                  <li key={s.id} className="text-sm rounded-lg px-3 py-2" style={{ color: 'var(--app-ink-2)', background: 'var(--app-surface-2)' }}>
                    <span className="font-medium">{s.session_type}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--app-ink-4)' }}>{s.status}</span>
                    {s.scheduled_at && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-4)' }}>{s.scheduled_at.slice(0, 10)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
