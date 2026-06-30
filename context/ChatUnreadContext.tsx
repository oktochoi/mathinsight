'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ChatUnreadContextValue = {
  total: number;
  byChannel: Record<string, number>;
  loading: boolean;
  refresh: () => Promise<void>;
  markChannelRead: (channelId: string) => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [total, setTotal] = useState(0);
  const [byChannel, setByChannel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const refresh = useCallback(async () => {
    if (!profile?.id) {
      setTotal(0);
      setByChannel({});
      setLoading(false);
      return;
    }

    const [countRes, byRes] = await Promise.all([
      supabase.rpc('get_my_chat_unread_count'),
      supabase.rpc('get_my_chat_unread_by_channel'),
    ]);

    if (!countRes.error) setTotal((countRes.data as number) ?? 0);

    const map: Record<string, number> = {};
    if (!byRes.error && byRes.data) {
      for (const row of byRes.data as { channel_id: string; unread_count: number }[]) {
        map[row.channel_id] = Number(row.unread_count);
      }
    }
    setByChannel(map);
    setLoading(false);
  }, [profile?.id]);

  refreshRef.current = refresh;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`chat-unread-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          void refreshRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const markChannelRead = useCallback(
    async (channelId: string) => {
      if (!profile?.id) return;
      await supabase.from('chat_channel_reads').upsert(
        {
          user_id: profile.id,
          channel_id: channelId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,channel_id' }
      );
      void refresh();
    },
    [profile?.id, refresh]
  );

  const value = useMemo(
    () => ({ total, byChannel, loading, refresh, markChannelRead }),
    [total, byChannel, loading, refresh, markChannelRead]
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}

export function useChatUnread() {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) {
    throw new Error('useChatUnread must be used within ChatUnreadProvider');
  }
  return ctx;
}
