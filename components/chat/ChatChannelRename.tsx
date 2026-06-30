'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { channelDisplayLabel } from '@/lib/chat/labels';
import type { ChatChannel } from '@/types/database';

export function ChatChannelRename({
  channel,
  onUpdated,
  compact,
}: {
  channel: ChatChannel | undefined;
  onUpdated?: () => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(channel?.display_name ?? '');
    setEditing(false);
  }, [channel?.id, channel?.display_name]);

  if (!channel) return null;

  const label = channelDisplayLabel(channel);

  const save = async () => {
    setSaving(true);
    setError(null);
    const trimmed = name.trim();
    const { error: err } = await supabase
      .from('chat_channels')
      .update({ display_name: trimmed || null })
      .eq('id', channel.id);
    setSaving(false);
    if (err) {
      setError('이름을 저장하지 못했습니다.');
      return;
    }
    setEditing(false);
    onUpdated?.();
  };

  if (editing) {
    return (
      <div className={compact ? 'px-1 pb-2' : 'pb-3 mb-3 border-b'} style={{ borderColor: 'var(--app-border)' }}>
        <div className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={label}
            maxLength={40}
            className="flex-1 text-sm px-3 py-1.5 rounded-lg border min-w-0"
            style={{ borderColor: 'var(--app-border)' }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg shrink-0"
            style={{ color: 'var(--app-accent)' }}
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs px-2 py-1.5 shrink-0"
            style={{ color: 'var(--app-ink-3)' }}
          >
            취소
          </button>
        </div>
        {error && <p className="text-[10px] mt-1 app-text-danger">{error}</p>}
        <p className="text-[10px] mt-1" style={{ color: 'var(--app-ink-4)' }}>
          비우면 기본 이름({label})이 사용됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'px-1 pb-2' : 'pb-3 mb-3 border-b'}`}
      style={{ borderColor: compact ? undefined : 'var(--app-border)' }}
    >
      <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--app-ink)' }}>
        {label}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-semibold shrink-0 px-2 py-1 rounded-lg hover:opacity-70"
        style={{ color: 'var(--app-accent)' }}
        title="채팅방 이름 변경"
      >
        <i className="ri-pencil-line mr-0.5" aria-hidden />
        이름
      </button>
    </div>
  );
}
