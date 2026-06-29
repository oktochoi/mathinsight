'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { AcademyIntegrations } from '@/types/database';

const DEFAULT_INTEGRATIONS = (academyId: string): AcademyIntegrations => ({
  academy_id: academyId,
  google_calendar_enabled: false,
  google_calendar_id: null,
  ics_feed_token: '',
  sms_enabled: false,
  kakao_enabled: false,
  sms_sender_name: null,
  kakao_channel_name: null,
  updated_at: new Date().toISOString(),
});

export function useIntegrations() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [integrations, setIntegrations] = useState<AcademyIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!profile?.academy_id) {
      setIntegrations(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('academy_integrations')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .maybeSingle();

    if (err) {
      setError('연동 설정을 불러오지 못했습니다.');
      setIntegrations(null);
    } else if (data) {
      setIntegrations(data as AcademyIntegrations);
    } else {
      const token = crypto.randomUUID().replace(/-/g, '');
      const row = {
        academy_id: profile.academy_id,
        ics_feed_token: token,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('academy_integrations').upsert(row, { onConflict: 'academy_id' });
      setIntegrations({ ...DEFAULT_INTEGRATIONS(profile.academy_id), ics_feed_token: token });
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations, dataVersion]);

  const saveIntegrations = async (
    patch: Partial<
      Pick<
        AcademyIntegrations,
        | 'google_calendar_enabled'
        | 'google_calendar_id'
        | 'sms_enabled'
        | 'kakao_enabled'
        | 'sms_sender_name'
        | 'kakao_channel_name'
      >
    >
  ) => {
    if (!profile?.academy_id) return { error: '로그인 정보가 없습니다.' };

    const row = {
      academy_id: profile.academy_id,
      ...patch,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = await supabase.from('academy_integrations').upsert(row, {
      onConflict: 'academy_id',
    });
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const regenerateIcsToken = async () => {
    if (!profile?.academy_id) return { error: '로그인 정보가 없습니다.' };
    const token = crypto.randomUUID().replace(/-/g, '');
    const { error: err } = await supabase.from('academy_integrations').upsert(
      {
        academy_id: profile.academy_id,
        ics_feed_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'academy_id' }
    );
    if (err) return { error: err.message, token: null };
    bumpDataVersion();
    return { error: null, token };
  };

  const icsFeedUrl =
    integrations?.ics_feed_token && typeof window !== 'undefined'
      ? `${window.location.origin}/api/calendar/ics?token=${integrations.ics_feed_token}`
      : integrations?.ics_feed_token
        ? `/api/calendar/ics?token=${integrations.ics_feed_token}`
        : null;

  return {
    integrations,
    loading,
    error,
    icsFeedUrl,
    refetch: fetchIntegrations,
    saveIntegrations,
    regenerateIcsToken,
  };
}
