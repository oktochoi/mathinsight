'use client';

import { useEffect, useRef } from 'react';
import { useChatChannel } from '@/hooks/useChatChannel';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { PageLoader } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

export function ChatPanel({
  channelId,
  studentId,
  classId,
  directAudience,
  title,
  onChannelReady,
  compact,
  onMarkRead,
}: {
  channelId: string | null;
  studentId?: string;
  classId?: string;
  directAudience?: 'parent' | 'student';
  title?: string;
  onChannelReady?: (channelId: string) => void;
  compact?: boolean;
  onMarkRead?: (channelId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    ensureDirectChannel,
    ensureClassGroupChannel,
    currentUserId,
    refetch,
  } = useChatChannel(channelId);

  useEffect(() => {
    if (!channelId && studentId) {
      void ensureDirectChannel(studentId, directAudience).then((r) => {
        if (r.channelId) onChannelReady?.(r.channelId);
      });
    }
    if (!channelId && classId) {
      void ensureClassGroupChannel(classId).then((r) => {
        if (r.channelId) onChannelReady?.(r.channelId);
      });
    }
  }, [channelId, studentId, classId, directAudience, ensureDirectChannel, ensureClassGroupChannel, onChannelReady]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!channelId || loading) return;
    onMarkRead?.(channelId);
  }, [channelId, loading, messages.length, onMarkRead]);

  const handleSend = async (body: string) => {
    const result = await sendMessage(body, {
      studentId: !channelId ? studentId : undefined,
      classId: !channelId ? classId : undefined,
      directAudience: !channelId ? directAudience : undefined,
    });
    if (!result.error && result.channelId && onChannelReady) {
      onChannelReady(result.channelId);
    }
    await refetch();
    return result;
  };

  if (!channelId && !studentId && !classId) {
    return (
      <p className="text-sm text-center py-12" style={{ color: 'var(--app-ink-3)' }}>
        대화를 선택하세요.
      </p>
    );
  }

  if (loading && messages.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className={cn('flex flex-col h-full', compact ? 'min-h-[200px]' : 'min-h-[320px]')}>
      {title && !compact && (
        <div className="pb-3 mb-3 border-b" style={{ borderColor: 'var(--app-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
            {title}
          </p>
        </div>
      )}
      {error && (
        <p className="text-xs mb-2 app-text-danger">{error}</p>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--app-ink-4)' }}>
            아직 메시지가 없습니다. 첫 메시지를 보내 보세요.
          </p>
        ) : (
          messages.map((m) => (
            <ChatBubble key={m.id} message={m} isMine={m.sender_id === currentUserId} />
          ))
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
