'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PortalSection({
  id,
  step,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  step?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('parent-card overflow-hidden', className)}>
      <div className="px-5 sm:px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-stone-50/80 to-white">
        <div className="flex items-start gap-3">
          {step && <span className="parent-section-badge shrink-0 mt-0.5">{step}</span>}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">{title}</h2>
            {description && (
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  );
}

export function PortalStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'score' | 'homework' | 'neutral';
}) {
  const bg =
    accent === 'score'
      ? 'bg-indigo-50/90 border-indigo-100'
      : accent === 'homework'
        ? 'bg-amber-50/80 border-amber-100'
        : 'bg-stone-50 border-stone-100';

  return (
    <div className={cn('rounded-xl border px-3 py-3.5 text-center', bg)}>
      <p className="text-[11px] font-semibold text-stone-500">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-stone-900 mt-1 tabular-nums leading-tight">
        {value}
      </p>
      {sub && <p className="text-[10px] text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}

export function PortalSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-indigo-500" aria-hidden />
      {children}
    </h3>
  );
}
