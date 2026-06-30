'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useStaffScope } from '@/hooks/useStaffScope';
import { fromDbRole } from '@/lib/roles';
import type { ChatChannel } from '@/types/database';

function filterChannelsByScope(
  channels: ChatChannel[],
  role: string | undefined,
  classIds: string[],
  studentIds: string[],
  isTeacher: boolean
): ChatChannel[] {
  const appRole = fromDbRole(role);
  if (appRole === 'owner' || appRole === 'desk') return channels;
  if (!isTeacher) return channels;

  const classSet = new Set(classIds);
  const studentSet = new Set(studentIds);

  return channels.filter((ch) => {
    if (ch.type === 'direct') return ch.student_id != null && studentSet.has(ch.student_id);
    if (ch.type === 'class_group') return ch.class_id != null && classSet.has(ch.class_id);
    return false;
  });
}

export function useChatChannels() {
  const { profile } = useAuth();
  const scope = useStaffScope();
  const [rawChannels, setRawChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channels = useMemo(
    () =>
      filterChannelsByScope(
        rawChannels,
        profile?.role,
        scope.classIds,
        scope.studentIds,
        scope.isTeacher
      ),
    [rawChannels, profile?.role, scope.classIds, scope.studentIds, scope.isTeacher]
  );

  const fetchChannels = useCallback(async () => {
    if (!profile?.academy_id) {
      setRawChannels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('chat_channels')
      .select('*, students(id, name, grade), classes(id, name)')
      .eq('academy_id', profile.academy_id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (err) {
      setError('채팅 목록을 불러오지 못했습니다.');
      setRawChannels([]);
    } else {
      setRawChannels((data ?? []) as ChatChannel[]);
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    void fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (!profile?.academy_id) return;
    const sub = supabase
      .channel(`chat-channels-${profile.academy_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_channels',
          filter: `academy_id=eq.${profile.academy_id}`,
        },
        () => {
          void fetchChannels();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [profile?.academy_id, fetchChannels]);

  return { channels, loading: loading || scope.loading, error, refetch: fetchChannels };
}
