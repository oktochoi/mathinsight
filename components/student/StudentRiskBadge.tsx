'use client';

import type { RiskDisplayKind } from '@/lib/studentRisk';
import { RISK_KIND_STYLES } from '@/lib/studentRisk';
import { cn } from '@/lib/cn';

export function StudentRiskBadge({
  kindLabel,
  kind,
  compact = false,
}: {
  kindLabel: string;
  kind: RiskDisplayKind;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border font-medium',
        RISK_KIND_STYLES[kind],
        compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      )}
    >
      {kindLabel}
    </span>
  );
}
