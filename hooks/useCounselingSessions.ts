'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { syncCounselingSessionArtifacts } from '@/lib/syncCounselingSession';
import { resolveCounselingContext } from '@/lib/studentParents';
import type { CounselingSession, CounselingSessionStatus, CounselingSessionType } from '@/types/database';

export function useCounselingSessions(studentId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!profile?.academy_id) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from('counseling_sessions')
      .select('*, students(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(80);
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error: err } = await q;
    if (err) {
      setError('상담 목록을 불러오지 못했습니다.');
      setSessions([]);
    } else {
      setSessions((data ?? []) as CounselingSession[]);
    }
    setLoading(false);
  }, [profile?.academy_id, studentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, dataVersion]);

  const createSession = async (input: {
    student_id: string;
    session_type: CounselingSessionType;
    scheduled_at?: string;
    title?: string;
    consultation_card_id?: string;
  }) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };

    const ctx = await resolveCounselingContext(
      profile.academy_id,
      input.student_id,
      profile.id
    );

    const { data, error: err } = await supabase
      .from('counseling_sessions')
      .insert({
        academy_id: profile.academy_id,
        student_id: input.student_id,
        session_type: input.session_type,
        scheduled_at: input.scheduled_at ?? null,
        title: input.title ?? '학습 상담',
        consultation_card_id: input.consultation_card_id ?? null,
        created_by: profile.id,
        counselor_id: ctx.counselorId,
        parent_id: ctx.parentId,
        enrollment_id: ctx.enrollmentId,
      })
      .select('id')
      .single();
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null, id: data?.id as string };
  };

  const updateSession = async (
    id: string,
    patch: Partial<{
      status: CounselingSessionStatus;
      summary: string;
      parent_message_draft: string;
      followup_checklist: CounselingSession['followup_checklist'];
      next_session_at: string | null;
      completed_at: string | null;
      recording_url: string | null;
      transcript: string | null;
      transcript_source: CounselingSession['transcript_source'];
    }>
  ) => {
    const { error: err } = await supabase
      .from('counseling_sessions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const syncReregistrationOnComplete = async (session: CounselingSession) => {
    if (!profile?.academy_id || session.session_type !== 'reregistration') return;

    const { data: existing } = await supabase
      .from('reregistration_records')
      .select('id')
      .eq('student_id', session.student_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const patch = {
      status: 'contacted' as const,
      counseling_session_id: session.id,
      parent_id: session.parent_id ?? null,
      memo: session.summary ?? undefined,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('reregistration_records')
        .update(patch)
        .eq('id', (existing as { id: string }).id);
    } else {
      await supabase.from('reregistration_records').insert({
        academy_id: profile.academy_id,
        student_id: session.student_id,
        ...patch,
      });
    }
  };

  const startSession = (id: string) => updateSession(id, { status: 'in_progress' });

  const completeSession = async (
    id: string,
    summary: string,
    parentMessage?: string,
    followup?: CounselingSession['followup_checklist']
  ) => {
    const session = sessions.find((s) => s.id === id);
    const result = await updateSession(id, {
      status: 'completed',
      summary: summary.trim() || undefined,
      parent_message_draft: parentMessage?.trim() || undefined,
      followup_checklist: followup ?? [],
      completed_at: new Date().toISOString(),
    });
    if (!result.error && session && profile?.academy_id) {
      await syncCounselingSessionArtifacts(session, profile.academy_id, {
        summary,
        parentMessage,
        checklist: followup ?? [],
        markCardComplete: true,
      });
      await syncReregistrationOnComplete(session);
    }
    return result;
  };

  const markFollowupNeeded = async (
    id: string,
    checklist?: CounselingSession['followup_checklist']
  ) => {
    const session = sessions.find((s) => s.id === id);
    const result = await updateSession(id, {
      status: 'followup_needed',
      followup_checklist: checklist ?? session?.followup_checklist ?? [],
    });
    if (!result.error && session && profile?.academy_id) {
      await syncCounselingSessionArtifacts(session, profile.academy_id, {
        checklist: checklist ?? session.followup_checklist,
        markCardComplete: true,
      });
    }
    return result;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    startSession,
    completeSession,
    markFollowupNeeded,
  };
}

/** 학부모·학생 포털용 */
export function usePortalCounselingSessions(studentId?: string) {
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    supabase
      .from('counseling_sessions')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['scheduled', 'in_progress', 'followup_needed'])
      .order('scheduled_at', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setSessions((data ?? []) as CounselingSession[]);
        setLoading(false);
      });
  }, [studentId]);

  return { sessions, loading };
}
