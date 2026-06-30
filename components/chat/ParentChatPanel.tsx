'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import type { Student } from '@/types/database';

export function ParentChatPanel({ child }: { child: Student }) {
  const [channelId, setChannelId] = useState<string | null>(null);

  return (
    <div className="parent-card-soft p-4 min-h-[280px] flex flex-col">
      <p className="text-xs font-semibold text-stone-500 mb-3">
        선생님께 메시지 ({child.name})
      </p>
      <div className="flex-1 min-h-0">
        <ChatPanel
          channelId={channelId}
          studentId={child.id}
          directAudience="parent"
          onChannelReady={setChannelId}
        />
      </div>
    </div>
  );
}
