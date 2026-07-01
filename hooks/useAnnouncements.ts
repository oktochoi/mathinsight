'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { Announcement, AnnouncementStatus, AnnouncementTargetType } from '@/types/database';
import { notifyAnnouncementPublished } from '@/lib/push/notifyAnnouncementClient';

export function useAnnouncements() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!profile?.academy_id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('announcements')
      .select('*, classes(id, name, grade), students(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (err) {
      setError('공지를 불러오지 못했습니다.');
      setItems([]);
    } else {
      setItems((data ?? []) as Announcement[]);
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, dataVersion]);

  const createAnnouncement = async (input: {
    title: string;
    body: string;
    target_type: AnnouncementTargetType;
    class_id?: string;
    student_id?: string;
    publish?: boolean;
  }) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };
    const status: AnnouncementStatus = input.publish ? 'published' : 'draft';
    const { data, error: err } = await supabase
      .from('announcements')
      .insert({
        academy_id: profile.academy_id,
        title: input.title.trim(),
        body: input.body.trim(),
        target_type: input.target_type,
        class_id: input.target_type === 'class' ? input.class_id ?? null : null,
        student_id: input.target_type === 'student' ? input.student_id ?? null : null,
        status,
        published_at: input.publish ? new Date().toISOString() : null,
        created_by: profile.id,
      })
      .select('id')
      .single();
    if (err) return { error: err.message };
    if (input.publish && data?.id) notifyAnnouncementPublished(data.id as string);
    bumpDataVersion();
    return { error: null, id: data?.id as string | undefined };
  };

  const publishAnnouncement = async (id: string) => {
    const { error: err } = await supabase
      .from('announcements')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);
    if (err) return { error: err.message };
    notifyAnnouncementPublished(id);
    bumpDataVersion();
    return { error: null };
  };

  const updateAnnouncement = async (
    id: string,
    input: {
      title: string;
      body: string;
      target_type: AnnouncementTargetType;
      class_id?: string;
      student_id?: string;
      publish?: boolean;
    }
  ) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    const status: AnnouncementStatus = input.publish ? 'published' : 'draft';
    const { error: err } = await supabase
      .from('announcements')
      .update({
        title: input.title.trim(),
        body: input.body.trim(),
        target_type: input.target_type,
        class_id: input.target_type === 'class' ? input.class_id ?? null : null,
        student_id: input.target_type === 'student' ? input.student_id ?? null : null,
        status,
        published_at: input.publish ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('academy_id', profile.academy_id);
    if (err) return { error: err.message };
    if (input.publish) notifyAnnouncementPublished(id);
    bumpDataVersion();
    return { error: null };
  };

  const deleteAnnouncement = async (id: string) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    const { error: err } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('academy_id', profile.academy_id);
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createAnnouncement,
    publishAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}

export function usePortalAnnouncements(studentId?: string, classId?: string | null) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        const all = (data ?? []) as Announcement[];
        const filtered = all.filter((a) => {
          if (a.target_type === 'all') return true;
          if (a.target_type === 'class' && classId && a.class_id === classId) return true;
          if (a.target_type === 'student' && studentId && a.student_id === studentId) return true;
          return false;
        });
        setItems(filtered);
        setLoading(false);
      });
  }, [studentId, classId]);

  return { items, loading };
}
