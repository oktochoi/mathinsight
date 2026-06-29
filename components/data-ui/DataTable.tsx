'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/components/ui/DataStates';

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  searchColumn?: string;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  selectedId?: string | null;
};

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = '검색…',
  pageSize = 10,
  loading = false,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  toolbar,
  onRowClick,
  getRowId,
  selectedId,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    getRowId: getRowId as ((row: T) => string) | undefined,
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="h-9 w-64 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-4">
              <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        {toolbar}
        <p className="text-xs text-slate-500 sm:ml-auto tabular-nums">
          {table.getFilteredRowModel().rows.length}건
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-100 bg-slate-50/80">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className="ri-arrow-up-s-line text-xs" />,
                              desc: <i className="ri-arrow-down-s-line text-xs" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <i className="ri-expand-up-down-line text-xs opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-50">
                {table.getRowModel().rows.map((row) => {
                  const rowId = getRowId?.(row.original);
                  const selected = selectedId && rowId === selectedId;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-blue-50/40',
                        selected && 'bg-blue-50/60 ring-1 ring-inset ring-blue-200/60'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5 text-sm text-slate-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/30">
              <p className="text-xs text-slate-500 tabular-nums">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
                {' '}/ {table.getFilteredRowModel().rows.length}건
              </p>
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                {Array.from({ length: table.getPageCount() }, (_, i) => i)
                  .filter((i) => {
                    const cur = table.getState().pagination.pageIndex;
                    return i === 0 || i === table.getPageCount() - 1 || Math.abs(i - cur) <= 1;
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => table.setPageIndex(item as number)}
                        className={cn(
                          'w-7 h-7 text-xs font-medium rounded-lg border cursor-pointer',
                          table.getState().pagination.pageIndex === item
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {(item as number) + 1}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
