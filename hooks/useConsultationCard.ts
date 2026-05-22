'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ConsultationCard } from '@/types/database';

export function useConsultationCard(id: string | undefined) {
  const { profile } = useAuth();
  const [card, setCard] = useState<ConsultationCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCard = useCallback(async () => {
    if (!id) {
      setCard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('consultation_cards')
      .select('*, students(id, name, grade, academy_id, classes(name))')
      .eq('id', id)
      .maybeSingle();

    if (err || !data) {
      setError('상담 카드를 불러오지 못했습니다.');
      setCard(null);
    } else {
      const row = data as ConsultationCard;
      if (
        profile?.academy_id &&
        (row.students as { academy_id?: string })?.academy_id !== profile.academy_id
      ) {
        setError('이 상담 카드에 접근할 수 없습니다.');
        setCard(null);
      } else {
        setCard(row);
      }
    }
    setLoading(false);
  }, [id, profile?.academy_id]);

  useEffect(() => {
    void fetchCard();
  }, [fetchCard]);

  return { card, loading, error, refetch: fetchCard };
}
