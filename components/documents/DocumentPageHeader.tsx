import Link from 'next/link';
import type { ReactNode } from 'react';

export function DocumentPageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 min-w-0">
      <div className="min-w-0">
        <Link
          href={backHref}
          className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 mb-2"
        >
          <i className="ri-arrow-left-line" />
          {backLabel}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
