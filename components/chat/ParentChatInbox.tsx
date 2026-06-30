'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useChatUnread } from '@/context/ChatUnreadContext';

export function ParentChatInbox({
  studentId,
  childName,
  compact,
}: {
  studentId: string;
  childName: string;
  compact?: boolean;
}) {
  const { markChannelRead } = useChatUnread();
  const [directChannelId, setDirectChannelId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0">
        <ChatPanel
          channelId={directChannelId}
          studentId={studentId}
          directAudience="parent"
          title={compact ? undefined : `${childName} · 담당 선생님`}
          compact={compact}
          onChannelReady={setDirectChannelId}
          onMarkRead={markChannelRead}
        />
      </div>
    </div>
  );
}
