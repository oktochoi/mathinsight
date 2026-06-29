'use client';

import { cn } from '@/lib/cn';

export function WorkspaceSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-2xl overflow-hidden', className)}
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-xs)',
      }}
    >
      <header className="px-5 py-4 border-b" style={{ borderColor: 'var(--app-border)' }}>
        <div className="flex items-baseline gap-3">
          {step && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest tabular-nums shrink-0"
              style={{ color: 'var(--app-ink-4)' }}
            >
              {step}
            </span>
          )}
          <div className="min-w-0">
            <h2
              className="text-sm font-bold"
              style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
