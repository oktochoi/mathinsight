'use client';

import { cn } from '@/lib/cn';
import type { BillingTodayTask } from '@/lib/billingOperations';

/** 오늘 처리할 수납 업무 — Action Center */
export function BillingActionCenter({
  tasks,
  activeFilter,
  onSelect,
}: {
  tasks: BillingTodayTask[];
  activeFilter: string | null;
  onSelect: (filterKey: BillingTodayTask['filterKey']) => void;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          Action Center
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
          오늘 처리해야 하는 수납 업무입니다. 항목을 누르면 해당 목록으로 이동합니다.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div
          className="rounded-xl px-4 py-10 text-center text-sm"
          style={{
            background: 'var(--app-surface-2)',
            border: '1px dashed var(--app-border)',
            color: 'var(--app-ink-3)',
          }}
        >
          오늘 긴급 수납 업무가 없습니다.
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const active = activeFilter === task.filterKey;
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onSelect(task.filterKey)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all',
                    'hover:shadow-sm'
                  )}
                  style={{
                    background: active ? 'var(--app-accent-bg)' : 'var(--app-surface)',
                    border: `1px solid ${active ? '#bfdbfe' : 'var(--app-border)'}`,
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold tabular-nums"
                    style={{
                      background: active ? 'var(--app-surface)' : 'var(--app-surface-2)',
                      color: active ? 'var(--app-accent-text)' : 'var(--app-ink-2)',
                    }}
                  >
                    {task.count}
                  </span>
                  <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                    {task.label}
                  </span>
                  <i className="ri-arrow-right-s-line" style={{ color: 'var(--app-ink-4)' }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
