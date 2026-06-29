'use client';

import Link from 'next/link';
import type { DashboardPriority } from '@/types/database';
import { cn } from '@/lib/cn';

const toneStyles: Record<string, string> = {
  warning: 'bg-amber-50 text-amber-900 border-amber-100',
  danger: 'bg-red-50 text-red-800 border-red-100',
};

export function ActionCenter({ items }: { items: DashboardPriority[] }) {
  const visible = items.slice(0, 4);

  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--app-ink)' }}>바로 가기</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--app-ink-3)' }}>자주 쓰는 메뉴로 이동합니다</p>
      <ul className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors hover:opacity-90',
                toneStyles[item.tone ?? '']
              )}
              style={!toneStyles[item.tone ?? ''] ? { border: '1px solid var(--app-border)', background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' } : undefined}
            >
              {item.text}
              <i className="ri-arrow-right-s-line text-base opacity-50" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
