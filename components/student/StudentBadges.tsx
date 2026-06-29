'use client';

import type { StudentBadge } from '@/types/database';
import { cn } from '@/lib/cn';

const BADGE_STYLES: Record<string, string> = {
  needs_review: 'bg-amber-50 text-amber-800 border-amber-200',
  homework_check: 'bg-orange-50 text-orange-800 border-orange-200',
  score_change: 'bg-blue-50 text-blue-800 border-blue-200',
  followup: 'bg-indigo-50 text-indigo-800 border-indigo-200',
};

export function StudentBadges({
  badges,
  compact = false,
}: {
  badges: StudentBadge[];
  compact?: boolean;
}) {
  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', compact && 'gap-1')}>
      {badges.map((b, i) => {
        const semanticStyle = BADGE_STYLES[b.type];
        return (
          <div
            key={`${b.type}-${i}`}
            className={cn(
              'rounded-lg border text-left',
              semanticStyle ?? '',
              compact ? 'px-2 py-1' : 'px-3 py-2'
            )}
            style={!semanticStyle ? { background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' } : undefined}
            title={b.reason}
          >
            <span className={cn('font-semibold', compact ? 'text-[10px]' : 'text-xs')}>
              {b.label}
            </span>
            {!compact && (
              <p className="text-[10px] mt-0.5 opacity-90 leading-snug">{b.reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
