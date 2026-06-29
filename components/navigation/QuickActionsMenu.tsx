'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QUICK_ACTIONS } from '@/lib/staffNavigation';
import { cn } from '@/lib/cn';

export function QuickActionsMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="app-btn app-btn-primary app-btn-sm hidden sm:inline-flex"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <i className="ri-add-line" />
        빠른 실행
        <i className={cn('ri-arrow-down-s-line text-sm transition-transform', open && 'rotate-180')} />
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="app-btn app-btn-primary app-btn-icon app-btn-sm sm:hidden"
        aria-label="빠른 실행"
        aria-expanded={open}
      >
        <i className="ri-add-line" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1.5 w-48 rounded-xl py-1.5 z-50"
            role="menu"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border-md)',
              boxShadow: 'var(--s-lg)',
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--app-surface-2)]"
                style={{ color: 'var(--app-ink-2)' }}
              >
                <i className={cn(action.icon, 'text-base')} style={{ color: 'var(--app-ink-3)' }} />
                {action.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
