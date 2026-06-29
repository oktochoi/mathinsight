'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

export function StudentSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn('app-card overflow-hidden', className)}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-2 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--app-border)' }}
      >
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--app-ink)', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>{description}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs font-medium shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--app-accent)' }}
          >
            {action.label} →
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
