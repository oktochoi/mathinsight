'use client';

import { cn } from '@/lib/cn';
import type { ChatMessage } from '@/types/database';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isMine ? 'rounded-br-md app-badge-info' : 'rounded-bl-md'
        )}
        style={
          isMine
            ? undefined
            : { background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }
        }
      >
        {!isMine && (
          <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--app-ink-3)' }}>
            {message.sender?.name ?? '사용자'}
          </p>
        )}
        <p style={{ color: 'var(--app-ink)' }}>{message.body}</p>
        <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--app-ink-4)' }}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
