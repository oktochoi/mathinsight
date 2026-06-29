'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function StudentSection({
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
    <section id={id} className={cn('student-card overflow-hidden', className)}>
      <div
        className="px-5 sm:px-6 py-4 border-b border-sky-100"
        style={{ background: 'linear-gradient(to right, rgba(240,249,255,0.9), var(--app-surface))' }}
      >
        <div className="flex items-start gap-3">
          {step && <span className="student-section-badge shrink-0 mt-0.5">{step}</span>}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--app-ink)' }}>{title}</h2>
            {description && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  );
}

export function StudentStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/15 px-3 py-3.5 text-center backdrop-blur-sm">
      <p className="text-[11px] font-medium text-sky-100">{label}</p>
      <p className="text-xl lg:text-2xl font-bold text-white mt-0.5 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-sky-100/90 mt-0.5">{sub}</p>}
    </div>
  );
}

export function StudentSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--app-ink)' }}>
      <span className="w-1 h-4 rounded-full bg-sky-500" aria-hidden />
      {children}
    </h3>
  );
}
