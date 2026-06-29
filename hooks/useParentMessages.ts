'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { resolveParentEntityId } from '@/lib/portalStudents';
import type { ParentMessage } from '@/types/database';

export function useParentMessagesStaff() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!profile?.academy_id) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('parent_messages')
      .select('*, students(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false })
      .limit(80);
    if (err) {
      setError('문의를 불러오지 못했습니다.');
      setMessages([]);
    } else {
      const ids = [...new Set((data ?? []).map((m) => m.parent_user_id))];
      let users: Record<string, { name: string; email: string }> = {};
      if (ids.length > 0) {
        const { data: urows } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', ids);
        for (const u of urows ?? []) {
          users[u.id] = { name: u.name, email: u.email };
        }
      }
      setMessages(
        ((data ?? []) as ParentMessage[]).map((m) => ({
          ...m,
          parent_user: users[m.parent_user_id]
            ? { id: m.parent_user_id, ...users[m.parent_user_id] }
            : null,
        }))
      );
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, dataVersion]);

  const replyMessage = async (id: string, staffReply: string, aiDraft?: string) => {
    if (!profile?.id) return { error: '로그인 정보가 없습니다.' };
    const { error: err } = await supabase
      .from('parent_messages')
      .update({
        staff_reply: staffReply.trim(),
        ai_draft_reply: aiDraft?.trim() || null,
        status: 'answered',
        replied_by: profile.id,
        replied_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const saveAiDraft = async (id: string, draft: string) => {
    const { error: err } = await supabase
      .from('parent_messages')
      .update({ ai_draft_reply: draft.trim() })
      .eq('id', id);
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  return { messages, loading, error, refetch: fetchMessages, replyMessage, saveAiDraft };
}

export function useParentMessagesPortal(studentId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    let q = supabase
      .from('parent_messages')
      .select('*, students(id, name, grade)')
      .eq('parent_user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (studentId) q = q.eq('student_id', studentId);
    const { data } = await q;
    setMessages((data ?? []) as ParentMessage[]);
    setLoading(false);
  }, [profile?.id, studentId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, dataVersion]);

  const sendMessage = async (input: {
    academy_id: string;
    student_id: string;
    subject: string;
    body: string;
  }) => {
    if (!profile?.id) return { error: '로그인이 필요합니다.' };
    const parentId = await resolveParentEntityId(profile.id, input.academy_id);
    const { error: err } = await supabase.from('parent_messages').insert({
      academy_id: input.academy_id,
      student_id: input.student_id,
      parent_user_id: profile.id,
      parent_id: parentId,
      subject: input.subject.trim(),
      body: input.body.trim(),
    });
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
}
