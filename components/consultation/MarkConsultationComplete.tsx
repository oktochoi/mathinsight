'use client';

import { useState } from 'react';
import { ConsultationStatusBadge } from '@/components/consultation/ConsultationStatusBadge';
import type { ConsultationCard } from '@/types/database';
import { formatConsultationStatusLine } from '@/lib/consultationStatus';

export function MarkConsultationComplete({
  card,
  onComplete,
}: {
  card: ConsultationCard;
  onComplete: (note: string) => Promise<{ error: string | null }>;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (card.consultation_status === 'completed') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ConsultationStatusBadge status="completed" />
          <span className="text-sm font-medium text-emerald-900">상담 진행 완료</span>
        </div>
        <p className="text-xs text-emerald-800">{formatConsultationStatusLine(card)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ConsultationStatusBadge status="pending" />
        <span className="text-sm font-medium text-amber-900">상담 대기</span>
      </div>
      <p className="text-xs text-amber-800 leading-relaxed">
        카드는 저장되었습니다. 학부모·학생과 실제 상담을 마친 뒤 아래에서 완료 처리하세요.
      </p>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="상담 메모 (선택) 예: 전화 상담, 대면 20분"
        className="w-full px-3 py-2 rounded-lg border border-amber-100 text-sm bg-white"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setErr(null);
          const { error } = await onComplete(note.trim());
          setSaving(false);
          if (error) setErr(error);
        }}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        {saving ? '저장 중...' : '상담 완료 처리'}
      </button>
    </div>
  );
}
