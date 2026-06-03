'use client';

import type { ConsultationStatus } from '@/types/database';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_STYLES,
} from '@/lib/consultationStatus';
import { cn } from '@/lib/cn';

export function ConsultationStatusBadge({
  status,
  className,
}: {
  status: ConsultationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-full border',
        CONSULTATION_STATUS_STYLES[status],
        className
      )}
    >
      {CONSULTATION_STATUS_LABELS[status]}
    </span>
  );
}
