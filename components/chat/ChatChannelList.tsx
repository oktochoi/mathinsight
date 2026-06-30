'use client';

import { cn } from '@/lib/cn';
import { channelDisplayLabel, channelListSubtitle } from '@/lib/chat/labels';
import type { ChatChannel } from '@/types/database';

export function ChatChannelList({
  channels,
  selectedId,
  onSelect,
  unreadByChannel,
  emptyAction,
}: {
  channels: ChatChannel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  unreadByChannel?: Record<string, number>;
  emptyAction?: React.ReactNode;
}) {
  if (channels.length === 0) {
    return (
      <div className="text-center py-10 px-4 space-y-3">
        <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
          아직 채팅방이 없습니다.
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
      {channels.map((ch) => {
        const unread = unreadByChannel?.[ch.id] ?? 0;
        return (
          <li key={ch.id}>
            <button
              type="button"
              onClick={() => onSelect(ch.id)}
              className={cn(
                'w-full text-left px-4 py-3 transition-colors flex items-start gap-2',
                selectedId === ch.id && 'bg-[var(--app-accent-bg)]'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                  {channelDisplayLabel(ch)}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--app-ink-4)' }}>
                  {ch.type === 'direct' ? '1:1' : '반 톡방'} · {channelListSubtitle(ch)} ·{' '}
                  {new Date(ch.updated_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {unread > 0 && (
                <span
                  className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--app-accent)' }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
