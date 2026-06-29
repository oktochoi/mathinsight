'use client';

import { cn } from '@/lib/cn';
import type { BillingTodayTask } from '@/lib/billingOperations';

export function BillingTodayTasks({
  tasks,
  activeFilter,
  onSelect,
}: {
  tasks: BillingTodayTask[];
  activeFilter: string | null;
  onSelect: (filterKey: BillingTodayTask['filterKey']) => void;
}) {
  return (
    <section className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>오늘 해야 할 일</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>항목을 누르면 해당 청구 목록으로 이동합니다.</p>
      </div>
      {tasks.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--app-ink-3)' }}>
          오늘 처리할 긴급 수납 업무가 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--app-border)]">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task.filterKey)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                style={activeFilter === task.filterKey ? { background: 'var(--app-surface-2)' } : undefined}
              >
                <span className="w-2 h-2 rounded-full shrink-0 bg-rose-500" />
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--app-ink)' }}>
                  {task.label}{' '}
                  <span className="tabular-nums font-normal" style={{ color: 'var(--app-ink-3)' }}>{task.count}건</span>
                </span>
                <i className="ri-arrow-right-s-line" style={{ color: 'var(--app-ink-4)' }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
