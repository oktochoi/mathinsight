'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { ConsultationCard } from '@/types/database';

export function useConsultationCards(studentId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [cards, setCards] = useState<ConsultationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('consultation_cards')
      .select('*, students(id, name, grade, academy_id, classes(name))')
      .order('created_at', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error: err } = await query;
    if (err) {
      setError('상담 카드를 불러오지 못했습니다.');
      setCards([]);
    } else {
      let list = (data ?? []) as ConsultationCard[];
      if (profile?.academy_id) {
        list = list.filter(
          (c) =>
            (c.students as { academy_id?: string })?.academy_id === profile.academy_id
        );
      }
      setCards(list);
    }
    setLoading(false);
  }, [studentId, profile?.academy_id]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards, dataVersion]);

  const saveCard = async (
    payload: Omit<
      ConsultationCard,
      'id' | 'created_at' | 'students' | 'consultation_status' | 'consulted_at' | 'consultation_note'
    >
  ) => {
    const { data, error: err } = await supabase
      .from('consultation_cards')
      .insert({
        ...payload,
        consultation_status: 'pending',
        generated_by: profile?.id ?? null,
      })
      .select('id')
      .single();
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null, cardId: data?.id as string | undefined };
  };

  const markConsultationComplete = async (cardId: string, note?: string) => {
    const { error: err } = await supabase
      .from('consultation_cards')
      .update({
        consultation_status: 'completed',
        consulted_at: new Date().toISOString(),
        consultation_note: note?.trim() || null,
      })
      .eq('id', cardId);
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  return { cards, loading, error, refetch: fetchCards, saveCard, markConsultationComplete };
}
