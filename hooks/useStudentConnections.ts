'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { StudentConnection, StudentConnectionRequest } from '@/types/database';

export function useStudentConnections(studentId: string | undefined) {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [connections, setConnections] = useState<StudentConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StudentConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);

    const [connRes, reqRes] = await Promise.all([
      supabase
        .from('student_connections')
        .select('*, user:users(id, email, name)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true }),
      supabase
        .from('student_connection_requests')
        .select('*, user:users(id, email, name)')
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (connRes.error || reqRes.error) {
      setError('연결 정보를 불러오지 못했습니다.');
    } else {
      setConnections((connRes.data ?? []) as StudentConnection[]);
      setPendingRequests((reqRes.data ?? []) as StudentConnectionRequest[]);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll, dataVersion]);

  return {
    connections,
    pendingRequests,
    pendingCount: pendingRequests.length,
    loading,
    error,
    refetch: fetchAll,
  };
}

export function useAcademyConnectionRequests() {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [requests, setRequests] = useState<StudentConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('student_connection_requests')
      .select(
        '*, user:users(id, email, name), student:students(id, name, grade)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (err) setError('연결 요청을 불러오지 못했습니다.');
    else setRequests((data ?? []) as StudentConnectionRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests, dataVersion]);

  const review = async (requestId: string, approve: boolean, studentId?: string) => {
    const { data, error: rpcError } = await supabase.rpc('review_student_connection_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_student_id: studentId ?? null,
    });
    const result = data as { ok?: boolean; error?: string } | null;
    if (rpcError || !result?.ok) {
      return { error: result?.error ?? rpcError?.message ?? '처리 실패' };
    }
    bumpDataVersion();
    await fetchRequests();
    return { error: null };
  };

  return { requests, loading, error, refetch: fetchRequests, review };
}

export function useLinkedStudentsForUser(userId: string | undefined) {
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStudentIds([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('student_connections')
        .select('student_id')
        .eq('user_id', userId);
      setStudentIds((data ?? []).map((r) => r.student_id as string));
      setLoading(false);
    })();
  }, [userId]);

  return { studentIds, loading };
}
