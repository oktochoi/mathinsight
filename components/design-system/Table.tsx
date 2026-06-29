'use client';

import { cn } from '@/lib/cn';
import { AppEmptyState } from './EmptyState';

export function TableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('app-table-shell', className)}>{children}</div>;
}

export function TableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('app-table-toolbar', className)}>{children}</div>;
}

export function TableSearch({
  value,
  onChange,
  placeholder = '검색…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative min-w-[12rem] flex-1 max-w-sm', className)}>
      <i
        className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
        style={{ color: 'var(--app-ink-4)' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
        style={{
          background: 'var(--app-surface-2)',
          border: '1px solid var(--app-border)',
          color: 'var(--app-ink)',
        }}
      />
    </div>
  );
}

export function DataTableShell({
  children,
  stickyHeader = true,
  className,
}: {
  children: React.ReactNode;
  stickyHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('app-table', stickyHeader && '[&_thead_th]:sticky [&_thead_th]:top-0')}>
        {children}
      </table>
    </div>
  );
}

export function TableEmptyRow({
  colSpan,
  title,
  description,
  primaryAction,
}: {
  colSpan: number;
  title: string;
  description?: string;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="!p-0">
        <AppEmptyState
          title={title}
          description={description}
          primaryAction={primaryAction}
          placeholder="Table Empty"
        />
      </td>
    </tr>
  );
}

/**
 * `components/data-ui/DataTable` 점진 마이그레이션 가이드:
 * - 컨테이너: `TableShell` + `TableToolbar` + `DataTableShell`
 * - 행 클릭 → `AppDrawer` 연결
 * - 상태 컬럼 → `EduBadge`
 */
