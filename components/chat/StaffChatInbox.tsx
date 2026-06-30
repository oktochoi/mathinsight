'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useChatChannels } from '@/hooks/useChatChannels';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { ChatChannelList } from '@/components/chat/ChatChannelList';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatCreateRoomModal } from '@/components/chat/ChatCreateRoomModal';
import { ChatChannelRename } from '@/components/chat/ChatChannelRename';
import { PageLoader } from '@/components/ui/DataStates';
import { channelDisplayLabel } from '@/lib/chat/labels';
import { cn } from '@/lib/cn';
import type { ChatChannel } from '@/types/database';

type Props = {
  initialChannelId?: string | null;
  compact?: boolean;
};

export function StaffChatInbox({ initialChannelId, compact }: Props) {
  const { channels, loading, error, refetch } = useChatChannels();
  const { byChannel, markChannelRead } = useChatUnread();
  const [selectedId, setSelectedId] = useState<string | null>(initialChannelId ?? null);
  const [mobileDetail, setMobileDetail] = useState(!!initialChannelId);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (initialChannelId) {
      setSelectedId(initialChannelId);
      setMobileDetail(true);
    }
  }, [initialChannelId]);

  useEffect(() => {
    if (selectedId || channels.length === 0) return;
    setSelectedId(channels[0].id);
  }, [channels, selectedId]);

  const selected = useMemo(
    () => channels.find((c) => c.id === selectedId),
    [channels, selectedId]
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
    void markChannelRead(id);
  };

  const handleCreated = (channelId: string) => {
    void refetch();
    setSelectedId(channelId);
    setMobileDetail(true);
    void markChannelRead(channelId);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', compact ? 'h-full' : 'min-h-[320px]')}>
        <PageLoader />
      </div>
    );
  }

  const hideListOnMobile = mobileDetail;
  const hideChatOnMobile = !mobileDetail;

  const createButton = (
    <button
      type="button"
      onClick={() => setCreateOpen(true)}
      className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1"
      style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}
    >
      <i className="ri-add-line" aria-hidden />
      새 채팅
    </button>
  );

  return (
    <>
      <div
        className={cn(
          'flex h-full min-h-0',
          compact ? 'flex-col' : 'flex-col lg:flex-row gap-4 min-h-[min(72vh,720px)]'
        )}
      >
        <section
          className={cn(
            'flex flex-col overflow-hidden min-h-0',
            compact ? 'flex-1' : 'rounded-2xl w-full lg:w-[min(100%,380px)] lg:shrink-0 min-h-[200px]',
            hideListOnMobile && (compact ? 'hidden' : 'hidden lg:flex')
          )}
          style={
            compact
              ? undefined
              : { background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }
          }
        >
          <div
            className={cn('shrink-0 flex items-center justify-between gap-2', compact ? 'px-1 py-2' : 'px-4 py-3')}
            style={
              compact
                ? { borderBottom: '1px solid var(--app-border)' }
                : { borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }
            }
          >
            <p className={compact ? 'text-xs font-bold' : 'app-label'} style={{ color: 'var(--app-ink)' }}>
              채팅방
            </p>
            {createButton}
          </div>
          {error && <p className="text-xs px-4 py-2 app-text-danger">{error}</p>}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ChatChannelList
              channels={channels}
              selectedId={selectedId}
              onSelect={handleSelect}
              unreadByChannel={byChannel}
              emptyAction={createButton}
            />
          </div>
        </section>

        <section
          className={cn(
            'flex flex-col overflow-hidden min-h-0 flex-1',
            !compact && 'rounded-2xl min-h-[320px]',
            hideChatOnMobile && (compact ? 'hidden' : 'hidden lg:flex')
          )}
          style={
            compact
              ? undefined
              : { background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }
          }
        >
          {mobileDetail && (
            <div
              className={cn('shrink-0 px-2 py-2 border-b flex items-center gap-2', !compact && 'lg:hidden')}
              style={{ borderColor: 'var(--app-border)' }}
            >
              <button
                type="button"
                onClick={() => setMobileDetail(false)}
                className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ color: 'var(--app-accent)' }}
              >
                ← 목록
              </button>
              {compact && selected && (
                <p className="text-xs font-semibold truncate flex-1" style={{ color: 'var(--app-ink)' }}>
                  {channelDisplayLabel(selected)}
                </p>
              )}
            </div>
          )}
          <div className={cn('flex-1 min-h-0 flex flex-col', compact ? 'px-1' : 'p-4')}>
            {selectedId && selected ? (
              <>
                <ChatChannelRename
                  channel={selected}
                  compact={compact}
                  onUpdated={() => void refetch()}
                />
                <div className="flex-1 min-h-0">
                  <ChatPanel
                    channelId={selectedId}
                    compact={compact}
                    onMarkRead={markChannelRead}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-center py-12" style={{ color: 'var(--app-ink-3)' }}>
                대화를 선택하거나 새 채팅을 만들어 주세요.
              </p>
            )}
          </div>
        </section>
      </div>

      <ChatCreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

export function StaffChatFullPageLink() {
  return (
    <Link
      href="/messages?mode=chat"
      className="text-[10px] font-semibold hover:opacity-80 whitespace-nowrap"
      style={{ color: 'var(--app-accent)' }}
    >
      전체 화면 →
    </Link>
  );
}
