'use client';

import {
  COUNSELING_STATUS_LABELS,
  COUNSELING_TYPE_LABELS,
} from '@/lib/counselingLabels';
import type { CounselingSession } from '@/types/database';

function formatScheduled(iso: string | null) {
  if (!iso) return '일정 협의 중';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ParentCounselingPanel({ sessions }: { sessions: CounselingSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">
        예정된 상담이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id} className="parent-card-soft p-4 border-l-4 border-indigo-400">
          <p className="font-semibold text-stone-900 text-sm">{s.title}</p>
          <p className="text-xs text-indigo-700 mt-1">{COUNSELING_TYPE_LABELS[s.session_type]}</p>
          <p className="text-sm text-stone-600 mt-2">{formatScheduled(s.scheduled_at)}</p>
          <p className="text-xs text-stone-500 mt-1">{COUNSELING_STATUS_LABELS[s.status]}</p>
        </li>
      ))}
    </ul>
  );
}
