'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ChatMessage } from '@/types/database';

export function useChatChannel(channelId: string | null) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (err) {
      setError('메시지를 불러오지 못했습니다.');
      setMessages([]);
    } else {
      const rows = (data ?? []) as ChatMessage[];
      const senderIds = [...new Set(rows.map((m) => m.sender_id))];
      let names: Record<string, string> = {};
      if (senderIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', senderIds);
        for (const u of users ?? []) {
          names[u.id] = u.name;
        }
      }
      setMessages(
        rows.map((m) => ({
          ...m,
          sender: { id: m.sender_id, name: names[m.sender_id] ?? '사용자' },
        }))
      );
    }
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!channelId) return;
    const sub = supabase
      .channel(`chat-msgs-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          void fetchMessages();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [channelId, fetchMessages]);

  const sendMessage = async (
    body: string,
    opts?: { studentId?: string; classId?: string; directAudience?: 'parent' | 'student' }
  ) => {
    if (!body.trim()) return { error: '내용을 입력해 주세요.' };
    setSending(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channelId ?? undefined,
          studentId: opts?.studentId,
          classId: opts?.classId,
          directAudience: opts?.directAudience,
          body: body.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        channelId?: string;
      };
      if (!data.ok) return { error: data.error ?? '전송 실패', channelId: undefined };
      return { error: null, channelId: data.channelId };
    } catch {
      return { error: '전송 중 오류가 발생했습니다.', channelId: undefined };
    } finally {
      setSending(false);
    }
  };

  const ensureDirectChannel = async (
    studentId: string,
    audience?: 'parent' | 'student'
  ) => {
    const { data, error: err } = await supabase.rpc('get_or_create_direct_chat_channel', {
      p_student_id: studentId,
      p_audience: audience ?? null,
    });
    if (err) return { channelId: null, error: err.message };
    return { channelId: data as string, error: null };
  };

  const ensureClassGroupChannel = async (classId: string) => {
    const { data, error: err } = await supabase.rpc('get_or_create_class_group_chat_channel', {
      p_class_id: classId,
    });
    if (err) return { channelId: null, error: err.message };
    return { channelId: data as string, error: null };
  };

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    ensureDirectChannel,
    ensureClassGroupChannel,
    refetch: fetchMessages,
    currentUserId: profile?.id ?? null,
  };
}
