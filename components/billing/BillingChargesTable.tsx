'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-ui/DataTable';
import { cn } from '@/lib/cn';
import { paymentOverdue } from '@/lib/retentionPrediction';
import { monthLabel } from '@/lib/billingOperations';
import type { EnrichedPaymentRow } from '@/lib/billingOperations';
import type { PaymentStatus } from '@/types/database';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: '미납',
  paid: '완납',
  overdue: '연체',
  waived: '면제',
};

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export function BillingChargesTable({
  rows,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onStudentClick,
  onMarkPaid,
  onContact,
  onRegisterNextMonth,
  today,
  toolbar,
}: {
  rows: EnrichedPaymentRow[];
  loading?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onStudentClick: (row: EnrichedPaymentRow) => void;
  onMarkPaid: (row: EnrichedPaymentRow) => void;
  onContact: (row: EnrichedPaymentRow) => void;
  onRegisterNextMonth: (row: EnrichedPaymentRow) => void;
  today: string;
  toolbar?: React.ReactNode;
}) {
  const columns = useMemo<ColumnDef<EnrichedPaymentRow, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => {
          const ids = rows.map((r) => r.payment.id);
          const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
          return (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleAll(ids)}
              aria-label="전체 선택"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.original.payment.id)}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(row.original.payment.id);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="선택"
          />
        ),
        size: 40,
      },
      {
        id: 'student',
        header: '학생',
        accessorFn: (r) => r.studentName,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStudentClick(row.original);
            }}
            className="text-left font-semibold text-sm hover:underline"
            style={{ color: 'var(--app-ink)' }}
          >
            {row.original.studentName}
            {row.original.grade && (
              <span className="font-normal ml-1" style={{ color: 'var(--app-ink-4)' }}>{row.original.grade}</span>
            )}
          </button>
        ),
      },
      {
        id: 'title',
        header: '청구명',
        accessorFn: (r) => r.payment.title,
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: 'var(--app-ink-2)' }}>{row.original.payment.title}</span>
        ),
      },
      {
        id: 'due',
        header: '납부기한',
        accessorFn: (r) => r.payment.due_date,
        cell: ({ row }) => (
          <span
            className="text-sm tabular-nums"
            style={{ color: row.original.isOverdue ? 'var(--app-danger)' : 'var(--app-ink-2)', fontWeight: row.original.isOverdue ? 500 : undefined }}
          >
            {row.original.payment.due_date}
            {row.original.isOverdue && (
              <span className="text-xs ml-1">(+{row.original.daysOverdue}일)</span>
            )}
          </span>
        ),
      },
      {
        id: 'amount',
        header: '금액',
        accessorFn: (r) => r.payment.amount,
        cell: ({ row }) => (
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--app-ink)' }}>
            {formatAmount(row.original.payment.amount)}
          </span>
        ),
      },
      {
        id: 'status',
        header: '상태',
        cell: ({ row }) => {
          const p = row.original.payment;
          const overdue = paymentOverdue(p, today);
          const status: PaymentStatus = overdue && p.status === 'pending' ? 'overdue' : p.status;
          return (
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-1 rounded-full border',
                status === 'paid' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                status === 'pending' && 'bg-amber-50 text-amber-900 border-amber-200',
                status === 'overdue' && 'bg-rose-50 text-rose-800 border-rose-200',
              )}
              style={status === 'waived' ? { background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' } : undefined}
            >
              {STATUS_LABELS[status]}
            </span>
          );
        },
      },
      {
        id: 'counseling',
        header: '최근 상담',
        cell: ({ row }) => (
          <span
            className="text-xs font-medium"
            style={{ color: row.original.hasRecentCounseling ? 'var(--app-success)' : 'var(--app-ink-4)' }}
          >
            {row.original.hasRecentCounseling ? '있음' : '—'}
          </span>
        ),
      },
      {
        id: 'rereg',
        header: '재등록 예정',
        cell: ({ row }) => (
          <span
            className="text-xs font-medium"
            style={{ color: row.original.reregistrationPending ? 'var(--app-violet)' : 'var(--app-ink-4)' }}
          >
            {row.original.reregistrationPending ? '예정' : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const isPaid = r.payment.status === 'paid';
          return (
            <div className="flex items-center gap-1.5 justify-end flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStudentClick(r);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
              >
                상세
              </button>
              {!isPaid && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContact(r);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
                  >
                    연락
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkPaid(r);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg app-btn app-btn-primary"
                  >
                    완납
                  </button>
                </>
              )}
              {isPaid && !r.hasNextMonthBilling && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegisterNextMonth(r);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg app-btn app-btn-primary"
                >
                  {monthLabel(r.nextMonthKey)} 청구
                </button>
              )}
              {isPaid && r.hasNextMonthBilling && (
                <span className="text-[10px] text-emerald-600 font-medium">다음달 등록됨</span>
              )}
            </div>
          );
        },
      },
    ],
    [
      rows,
      selectedIds,
      onToggleAll,
      onToggleSelect,
      onStudentClick,
      onMarkPaid,
      onContact,
      onRegisterNextMonth,
      today,
    ]
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      loading={loading}
      searchPlaceholder="학생·청구명 검색…"
      pageSize={15}
      emptyTitle="청구 내역이 없습니다"
      emptyDescription="「청구 등록」으로 수강료를 추가하세요."
      getRowId={(r) => r.payment.id}
      onRowClick={onStudentClick}
      toolbar={toolbar}
    />
  );
}
