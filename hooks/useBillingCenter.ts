'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useCounselingSessions } from '@/hooks/useCounselingSessions';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { fetchReregistrationRecords } from '@/lib/retentionData';
import {
  buildBillingForecast,
  buildBillingInsights,
  buildBillingTodayTasks,
  buildPaymentTimeline,
  buildStudentBillingSummary,
  computeBillingKpis,
  computeClassCollectionRates,
  enrichPaymentRows,
  filterEnrichedRows,
  type BillingListFilter,
} from '@/lib/billingOperations';
import type { ReregistrationRecord } from '@/types/database';

export function useBillingCenter() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const billing = useBilling();
  const { students, loading: studentsLoading } = useStudents();
  const { classes, loading: classesLoading } = useClasses();
  const { sessions: counseling, loading: counselingLoading } = useCounselingSessions();
  const [reregRecords, setReregRecords] = useState<ReregistrationRecord[]>([]);
  const [reregLoading, setReregLoading] = useState(true);

  const fetchRereg = useCallback(async () => {
    if (!profile?.academy_id) {
      setReregRecords([]);
      setReregLoading(false);
      return;
    }
    setReregLoading(true);
    const { records } = await fetchReregistrationRecords(profile.academy_id);
    setReregRecords(records);
    setReregLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    void fetchRereg();
  }, [fetchRereg, dataVersion]);

  const today = new Date().toISOString().slice(0, 10);
  const loading =
    billing.loading || studentsLoading || classesLoading || counselingLoading || reregLoading;

  const enrichedRows = useMemo(
    () =>
      enrichPaymentRows(
        billing.payments,
        students,
        classes.map((c) => ({ id: c.id, name: c.name, grade: c.grade })),
        counseling,
        reregRecords,
        today
      ),
    [billing.payments, students, classes, counseling, reregRecords, today]
  );

  const kpis = useMemo(() => computeBillingKpis(billing.payments, today), [billing.payments, today]);
  const timeline = useMemo(() => buildPaymentTimeline(billing.payments), [billing.payments]);
  const todayTasks = useMemo(
    () => buildBillingTodayTasks(enrichedRows, today),
    [enrichedRows, today]
  );
  const classRates = useMemo(() => computeClassCollectionRates(enrichedRows), [enrichedRows]);
  const insights = useMemo(
    () => buildBillingInsights(enrichedRows, classRates, kpis),
    [enrichedRows, classRates, kpis]
  );
  const activeStudentCount = students.filter((s) => s.enrollment_status === 'active').length;
  const forecast = useMemo(
    () => buildBillingForecast(billing.payments, kpis, activeStudentCount),
    [billing.payments, kpis, activeStudentCount]
  );

  const filterRows = (filter: BillingListFilter) =>
    filterEnrichedRows(enrichedRows, filter, today);

  const studentSummary = (studentId: string, studentName: string) => {
    const studentPayments = billing.payments.filter((p) => p.student_id === studentId);
    const hasRereg = reregRecords.some(
      (r) =>
        r.student_id === studentId && ['pending', 'contacted', 'deferred'].includes(r.status)
    );
    const counselingCount = counseling.filter(
      (s) =>
        s.student_id === studentId &&
        (s.status === 'completed' || s.status === 'followup_needed')
    ).length;
    return buildStudentBillingSummary(
      studentName,
      studentPayments,
      hasRereg,
      counselingCount,
      today
    );
  };

  const studentCounseling = (studentId: string) =>
    counseling.filter((s) => s.student_id === studentId).slice(0, 8);

  const studentPayments = (studentId: string) =>
    billing.payments.filter((p) => p.student_id === studentId);

  return {
    ...billing,
    loading,
    today,
    enrichedRows,
    kpis,
    timeline,
    todayTasks,
    classRates,
    insights,
    forecast,
    students,
    classes,
    reregRecords,
    filterRows,
    studentSummary,
    studentCounseling,
    studentPayments,
    refetchRereg: fetchRereg,
  };
}
