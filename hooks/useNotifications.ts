'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { NotificationChannel, NotificationLog } from '@/types/database';

export function useNotifications() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!profile?.academy_id) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false })
      .limit(60);
    if (err) {
      setError('알림 기록을 불러오지 못했습니다.');
      setLogs([]);
    } else {
      setLogs((data ?? []) as NotificationLog[]);
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, dataVersion]);

  const sendDemo = async (input: {
    channel: NotificationChannel;
    recipient_label: string;
    message: string;
    student_id?: string;
    template_key?: string;
  }) => {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return { error: json.error ?? '발송에 실패했습니다.' };
    bumpDataVersion();
    return { error: null };
  };

  return { logs, loading, error, refetch: fetchLogs, sendDemo };
}
