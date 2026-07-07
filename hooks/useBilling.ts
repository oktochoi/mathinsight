'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useStaffScope } from '@/hooks/useStaffScope';
import { paymentOverdue } from '@/lib/retentionPrediction';
import { suggestNextMonthBilling } from '@/lib/billingOperations';
import { notifyPaymentPush } from '@/lib/push/notifyPaymentClient';
import type { PaymentStatus, StudentPayment } from '@/types/database';

function isDuplicateBilling(
  existing: StudentPayment[],
  input: { student_id: string; title: string; due_date: string; billing_month?: string | null }
): boolean {
  const monthKey = input.billing_month ?? input.due_date.slice(0, 7);
  const titleNorm = input.title.trim();
  return existing.some(
    (p) =>
      p.student_id === input.student_id &&
      (p.billing_month === monthKey ||
        p.due_date.startsWith(monthKey) ||
        (p.title.trim() === titleNorm && p.due_date === input.due_date))
  );
}

export function useBilling(studentId?: string) {
  const { profile } = useAuth();
  const scope = useStaffScope();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!profile?.academy_id) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from('student_payments')
      .select('*, students(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('due_date', { ascending: false })
      .limit(500);
    if (studentId) q = q.eq('student_id', studentId);
    else if (scope.isTeacher && scope.studentIds.length > 0) {
      q = q.in('student_id', scope.studentIds);
    }
    const { data, error: err } = await q;
    if (err) {
      setError('결제 내역을 불러오지 못했습니다.');
      setPayments([]);
    } else {
      setPayments((data ?? []) as StudentPayment[]);
    }
    setLoading(false);
  }, [profile?.academy_id, studentId, scope.isTeacher, scope.studentIds]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, dataVersion]);

  const createPayment = async (input: {
    student_id: string;
    title: string;
    amount: number;
    due_date: string;
    billing_month?: string;
    memo?: string;
  }) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };
    if (isDuplicateBilling(payments, input)) {
      return { error: '동일 학생·기간에 이미 등록된 청구가 있습니다.' };
    }
    const { data, error: err } = await supabase
      .from('student_payments')
      .insert({
        academy_id: profile.academy_id,
        student_id: input.student_id,
        title: input.title.trim(),
        amount: input.amount,
        due_date: input.due_date,
        billing_month: input.billing_month ?? null,
        memo: input.memo?.trim() || null,
        status: 'pending',
        created_by: profile.id,
      })
      .select('id')
      .single();
    if (err) return { error: err.message };
    bumpDataVersion();
    if (data?.id) notifyPaymentPush(data.id as string, 'created');
    return { error: null, paymentId: data?.id as string | undefined };
  };

  const updatePaymentStatus = async (
    id: string,
    status: PaymentStatus,
    paymentMethod?: string
  ) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'paid') {
      patch.paid_at = new Date().toISOString();
      patch.payment_method = paymentMethod ?? '현장';
    }
    const { error: err } = await supabase.from('student_payments').update(patch).eq('id', id);
    if (err) return { error: err.message };
    if (status === 'paid') notifyPaymentPush(id, 'paid');
    bumpDataVersion();
    return { error: null };
  };

  const createPaymentsBulk = async (
    rows: {
      student_id: string;
      title: string;
      amount: number;
      due_date: string;
      billing_month?: string;
    }[]
  ) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.', count: 0 };
    if (rows.length === 0) return { error: '청구 대상이 없습니다.', count: 0 };
    const uniqueRows = rows.filter((r) => !isDuplicateBilling(payments, r));
    if (uniqueRows.length === 0) {
      return { error: '선택한 학생 모두 동일 기간 청구가 이미 있습니다.', count: 0 };
    }
    const payload = uniqueRows.map((r) => ({
      academy_id: profile.academy_id,
      student_id: r.student_id,
      title: r.title.trim(),
      amount: r.amount,
      due_date: r.due_date,
      billing_month: r.billing_month ?? null,
      status: 'pending' as const,
      created_by: profile.id,
    }));
    const { data, error: err } = await supabase.from('student_payments').insert(payload).select('id');
    if (err) return { error: err.message, count: 0 };
    for (const row of data ?? []) {
      notifyPaymentPush(row.id as string, 'created');
    }
    bumpDataVersion();
    const skipped = rows.length - uniqueRows.length;
    return {
      error: skipped > 0 ? `${skipped}건은 중복으로 건너뛰었습니다.` : null,
      count: uniqueRows.length,
    };
  };

  const updateDueDate = async (ids: string[], due_date: string) => {
    if (ids.length === 0) return { error: '선택된 청구가 없습니다.' };
    const { error: err } = await supabase
      .from('student_payments')
      .update({ due_date })
      .in('id', ids);
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const copyPayment = async (id: string, due_date: string) => {
    const src = payments.find((p) => p.id === id);
    if (!src) return { error: '청구를 찾을 수 없습니다.' };
    return createPayment({
      student_id: src.student_id,
      title: src.title,
      amount: src.amount,
      due_date,
      billing_month: src.billing_month ?? undefined,
      memo: src.memo ?? undefined,
    });
  };

  const createNextMonthBilling = async (sourcePaymentId: string) => {
    const src = payments.find((p) => p.id === sourcePaymentId);
    if (!src) return { error: '청구를 찾을 수 없습니다.' };
    const next = suggestNextMonthBilling(src);
    const duplicate = payments.some(
      (p) =>
        p.student_id === src.student_id &&
        (p.billing_month === next.billing_month ||
          p.due_date.startsWith(next.billing_month))
    );
    if (duplicate) return { error: `${next.monthLabel} 청구가 이미 있습니다.` };
    return createPayment({
      student_id: src.student_id,
      title: next.title,
      amount: next.amount,
      due_date: next.due_date,
      billing_month: next.billing_month,
    });
  };

  const registerReregistration = async (studentId: string) => {
    if (!profile?.academy_id) return { error: '로그인 정보가 없습니다.' };
    const { data: existing } = await supabase
      .from('reregistration_records')
      .select('id, status')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && ['pending', 'contacted', 'confirmed'].includes((existing as { status: string }).status)) {
      return { error: null, already: true };
    }

    if (existing) {
      const { error: err } = await supabase
        .from('reregistration_records')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', (existing as { id: string }).id);
      if (err) return { error: err.message };
    } else {
      const { error: err } = await supabase.from('reregistration_records').insert({
        academy_id: profile.academy_id,
        student_id: studentId,
        status: 'pending',
      });
      if (err) return { error: err.message };
    }
    bumpDataVersion();
    return { error: null, already: false };
  };

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = payments.filter((p) => paymentOverdue(p, today)).length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  return {
    payments,
    loading,
    error,
    overdueCount,
    pendingCount,
    refetch: fetchPayments,
    createPayment,
    createPaymentsBulk,
    updatePaymentStatus,
    updateDueDate,
    copyPayment,
    createNextMonthBilling,
    registerReregistration,
  };
}

/** 학부모 포털 — 자녀 수강료 */
export function usePortalPayments(studentId?: string) {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setPayments([]);
      return;
    }
    setLoading(true);
    supabase
      .from('student_payments')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        setPayments((data ?? []) as StudentPayment[]);
        setLoading(false);
      });
  }, [studentId]);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = payments.filter((p) => paymentOverdue(p, today));

  return { payments, overdue, loading };
}
