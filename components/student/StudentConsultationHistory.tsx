'use client';

import Link from 'next/link';
import { consultationCardPath } from '@/lib/documentRoutes';
import type { ConsultationCard } from '@/types/database';
import { ConsultationStatusBadge } from '@/components/consultation/ConsultationStatusBadge';
import { formatConsultationStatusLine } from '@/lib/consultationStatus';

export function StudentConsultationHistory({ cards }: { cards: ConsultationCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--app-ink-4)' }}>
        저장된 상담 카드가 없습니다. 상담 카드 메뉴에서 생성·저장할 수 있습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--app-border)]">
      {cards.slice(0, 8).map((c) => {
        const status = c.consultation_status ?? 'pending';
        return (
          <li key={c.id}>
            <Link
              href={consultationCardPath(c.id)}
              className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-[var(--app-surface-2)] px-1 -mx-1 rounded-lg transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:text-indigo-700" style={{ color: 'var(--app-ink)' }}>
                  {c.period_start} ~ {c.period_end}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>{formatConsultationStatusLine(c)}</p>
              </div>
              <ConsultationStatusBadge status={status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
