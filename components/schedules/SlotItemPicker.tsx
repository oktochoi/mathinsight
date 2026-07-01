'use client';

import type { CalendarSlotItem, CalendarTimeSlot } from '@/lib/growthPipeline';
import { formatTimeRange } from '@/lib/scheduleLabels';

type Props = {
  slot: CalendarTimeSlot;
  onSelect: (index: number) => void;
  onCancel: () => void;
};

export function SlotItemPicker({ slot, onSelect, onCancel }: Props) {
  return (
    <div className="space-y-3 app-fade-in">
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--app-ink-3)' }}>
          {slot.date} · {formatTimeRange(slot.startTime, slot.endTime)}
        </p>
        <h3 className="text-base font-bold mt-1" style={{ color: 'var(--app-ink)' }}>
          무엇을 볼까요?
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-4)' }}>
          이 시간대에 {slot.items.length}건이 있습니다.
        </p>
      </div>
      <ul className="space-y-2">
        {slot.items.map((item, index) => (
          <li key={itemKey(item, index)}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className="w-full text-left rounded-xl px-4 py-3 transition-colors hover:bg-[var(--app-surface-2)]"
              style={{ border: '1px solid var(--app-border)' }}
            >
              <SlotItemLabel item={item} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onCancel} className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
        선택 취소
      </button>
    </div>
  );
}

function itemKey(item: CalendarSlotItem, index: number) {
  if (item.kind === 'lesson') return `lesson-${item.event.id}`;
  return `intake-${item.event.id}-${index}`;
}

function SlotItemLabel({ item }: { item: CalendarSlotItem }) {
  if (item.kind === 'lesson') {
    const ev = item.event;
    return (
      <>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800">
          수업
        </span>
        <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--app-ink)' }}>
          {ev.className}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
          {formatTimeRange(ev.startTime, ev.endTime)}
        </p>
      </>
    );
  }
  return (
    <>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-900">
        신입 상담
      </span>
      <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--app-ink)' }}>
        {item.event.prospectName}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
        {item.event.grade}
      </p>
    </>
  );
}
