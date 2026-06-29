'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function StaffBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span style={{ color: 'var(--app-ink-4)' }} aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium truncate transition-colors hover:opacity-70"
                  style={{ color: 'var(--app-ink-3)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn('truncate', isLast ? 'font-semibold' : 'font-medium')}
                  style={{ color: isLast ? 'var(--app-ink)' : 'var(--app-ink-3)' }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
