'use client';

import { cn } from '@/lib/cn';

export function BillingSelectionBar({
  count,
  onChangeDueDate,
  onSendSms,
  onSendKakao,
  onBulkNextMonth,
  onClear,
}: {
  count: number;
  onChangeDueDate: () => void;
  onSendSms: () => void;
  onSendKakao: () => void;
  onBulkNextMonth: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'sticky bottom-4 z-30 mx-auto max-w-3xl',
        'flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl shadow-xl'
      )}
      style={{ background: 'var(--app-ink)', color: '#fff', border: '1px solid var(--app-ink-2)' }}
    >
      <span className="text-sm font-semibold tabular-nums mr-1">{count}건 선택</span>
      <button
        type="button"
        onClick={onChangeDueDate}
        className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
      >
        납부기한 변경
      </button>
      <button
        type="button"
        onClick={onSendSms}
        className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
      >
        문자
      </button>
      <button
        type="button"
        onClick={onSendKakao}
        className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
      >
        카카오
      </button>
      <button
        type="button"
        onClick={onBulkNextMonth}
        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 font-semibold"
      >
        다음달 청구
      </button>
      <button
        type="button"
        onClick={onClear}
        className="text-xs px-3 py-1.5 rounded-lg ml-auto hover:text-white"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        선택 해제
      </button>
    </div>
  );
}
