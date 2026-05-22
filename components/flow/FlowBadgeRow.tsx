'use client';

import type { FlowBadge } from '@/lib/learningFlow';
import { cn } from '@/lib/cn';

const TONE: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  muted: 'bg-slate-100 text-slate-500 border-slate-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

export function FlowBadgeRow({ badges }: { badges: FlowBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.key}
          className={cn(
            'text-[10px] font-medium px-2 py-0.5 rounded-full border',
            TONE[b.tone] ?? TONE.muted
          )}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
