'use client';

import { useRouter } from 'next/navigation';
import type { RiskDisplayKind } from '@/lib/studentRisk';

export function ConsultationBriefingOverlay({
  studentId,
  briefing,
  kind,
  onClose,
}: {
  studentId: string;
  briefing: { headline: string; lines: string[] };
  kind: RiskDisplayKind;
  onClose: () => void;
}) {
  const router = useRouter();
  const isConsultation = kind === 'consultation';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--app-surface)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="상담 브리핑"
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            background: isConsultation ? '#fff1f2' : '#faf5ff',
            borderColor: isConsultation ? '#fecdd3' : '#e9d5ff',
          }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: isConsultation ? '#991b1b' : '#5b21b6' }}
            >
              상담 전 30초 브리핑
            </p>
            <p className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>
              {briefing.headline}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--app-ink-3)' }}
            aria-label="닫기"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="px-5 py-5">
          <ul className="space-y-3">
            {briefing.lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                  style={{ background: 'var(--app-accent)' }}
                />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/counseling?step=session&student=${studentId}`);
            }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--app-accent)' }}
          >
            이 브리핑으로 상담 시작
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--app-surface-2)',
              color: 'var(--app-ink-3)',
              border: '1px solid var(--app-border)',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
