'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-ui/DataTable';
import { StatusBadge } from '@/components/data-ui/StatusBadge';
import type { RetentionSignal } from '@/types/database';
import { RETENTION_LEVEL_LABELS } from '@/lib/retentionPrediction';

const levelTone = (level: string): 'danger' | 'warning' | 'success' => {
  if (level === 'high') return 'danger';
  if (level === 'medium') return 'warning';
  return 'success';
};

export function RetentionDataTable({
  signals,
  loading,
}: {
  signals: RetentionSignal[];
  loading?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () =>
      [...signals].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.risk_level] - order[b.risk_level] || b.score - a.score;
      }),
    [signals]
  );

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const columns = useMemo<ColumnDef<RetentionSignal, unknown>[]>(
    () => [
      {
        id: 'select',
        enableSorting: false,
        header: ({ table }) => {
          const allIds = table.getCoreRowModel().rows.map((r) => r.original.id);
          const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
          return (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {
                if (allSelected) setSelected(new Set());
                else setSelected(new Set(allIds));
              }}
              className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selected.has(row.original.id)}
            onChange={() => toggleRow(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
          />
        ),
      },
      {
        id: 'name',
        header: '학생명',
        accessorFn: (row) => row.students?.name ?? '학생',
        cell: ({ row }) => (
          <Link
            href={`/students/${row.original.student_id}`}
            className="font-semibold text-slate-900 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.students?.name ?? '학생'}
          </Link>
        ),
      },
      {
        id: 'grade',
        header: '학년',
        accessorFn: (row) => row.students?.grade ?? '—',
      },
      {
        id: 'level',
        header: '재등록 상태',
        accessorFn: (row) => RETENTION_LEVEL_LABELS[row.risk_level],
        cell: ({ row, getValue }) => (
          <StatusBadge label={String(getValue())} tone={levelTone(row.original.risk_level)} dot />
        ),
      },
      {
        id: 'score',
        header: '관리 점수',
        accessorKey: 'score',
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums text-slate-800">{String(getValue())}</span>
        ),
      },
      {
        id: 'reason',
        header: '확인 사항',
        accessorKey: 'reason',
        cell: ({ getValue, row }) => (
          <div className="max-w-[240px]">
            <p className="text-sm text-slate-600 truncate">{String(getValue())}</p>
            {Array.isArray(row.original.signals) && row.original.signals.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {row.original.signals.slice(0, 3).map((sig) => (
                  <span
                    key={sig.id}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                  >
                    {sig.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '작업',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/students/${row.original.student_id}`}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              상세
            </Link>
            <Link
              href={`/counseling?student=${row.original.student_id}&type=reregistration`}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
            >
              상담
            </Link>
          </div>
        ),
      },
    ],
    [selected]
  );

  const selectedSignals = sorted.filter((s) => selected.has(s.id));
  const notifHref = `/parent-hub?tab=messages`;

  return (
    <div className="space-y-0">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-indigo-50 border border-b-0 border-indigo-200 rounded-t-xl">
          <span className="text-sm font-semibold text-indigo-900">
            <i className="ri-checkbox-multiple-line mr-1" />
            {selected.size}명 선택됨
          </span>
          <div className="flex gap-2 ml-auto">
            <Link
              href={notifHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <i className="ri-mail-send-line" />
              학부모 문의
            </Link>
            <Link
              href={`/counseling?type=reregistration&students=${[...selected].map((id) => sorted.find((s) => s.id === id)?.student_id).filter(Boolean).join(',')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50"
            >
              <i className="ri-chat-smile-3-line" />
              일괄 상담 예약
            </Link>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-white"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}
      <DataTable
        data={sorted}
        columns={columns}
        loading={loading}
        searchPlaceholder="학생 검색…"
        pageSize={10}
        getRowId={(row) => row.id}
        emptyTitle="스캔 기록이 없습니다"
        emptyDescription="「학습 신호 갱신」을 눌러 상담 권장 학생을 계산하세요."
      />
    </div>
  );
}
