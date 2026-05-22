'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { ConsultationFollowup, FollowupStatus } from '@/types/database';

export function useConsultationFollowups(studentId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [followups, setFollowups] = useState<ConsultationFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.academy_id) {
      setFollowups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from('consultation_followups')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data } = await q.limit(100);
    setFollowups((data ?? []) as ConsultationFollowup[]);
    setLoading(false);
  }, [profile?.academy_id, studentId]);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  const bump = useAppStore((s) => s.bumpDataVersion);

  const addFollowup = async (row: {
    student_id: string;
    consultation_card_id?: string | null;
    title: string;
    memo: string;
    due_date?: string | null;
  }) => {
    if (!profile?.academy_id) return { error: '학원 정보 없음' };
    const { error } = await supabase.from('consultation_followups').insert({
      academy_id: profile.academy_id,
      ...row,
      status: 'pending' as FollowupStatus,
    });
    if (!error) bump();
    return { error: error?.message ?? null };
  };

  const updateStatus = async (id: string, status: FollowupStatus) => {
    const { error } = await supabase
      .from('consultation_followups')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) bump();
    return { error: error?.message ?? null };
  };

  return { followups, loading, refetch: load, addFollowup, updateStatus };
}
