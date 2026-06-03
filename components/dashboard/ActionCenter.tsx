'use client';

import Link from 'next/link';
import type { DashboardPriority } from '@/types/database';
import { cn } from '@/lib/cn';

const toneStyles: Record<string, string> = {
  warning: 'bg-amber-50 text-amber-900 border-amber-100',
  info: 'bg-slate-50 text-slate-800 border-slate-100',
  danger: 'bg-red-50 text-red-800 border-red-100',
};

export function ActionCenter({ items }: { items: DashboardPriority[] }) {
  const visible = items.slice(0, 4);

  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">바로 가기</h3>
      <p className="text-xs text-slate-500 mb-3">자주 쓰는 메뉴로 이동합니다</p>
      <ul className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors hover:opacity-90',
                toneStyles[item.tone ?? 'info']
              )}
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
