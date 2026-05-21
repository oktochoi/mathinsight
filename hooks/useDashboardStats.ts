'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import {
  getAttentionStudents,
  calculateHomeworkTrend,
  calculateScoreTrend,
} from '@/lib/analytics';
import type { DashboardStats, LessonLog, ParentReport, Student } from '@/types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useDashboardStats() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.academy_id) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const academyId = profile.academy_id;
    const today = todayStr();

    const [studentsRes, logsRes, reportsRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, classes(name)')
        .eq('academy_id', academyId),
      supabase
        .from('lesson_logs')
        .select('*')
        .eq('academy_id', academyId)
        .order('lesson_date', { ascending: false })
        .limit(500),
      (async () => {
        const { data: sts } = await supabase
          .from('students')
          .select('id')
          .eq('academy_id', academyId);
        const ids = (sts ?? []).map((s) => s.id);
        if (ids.length === 0) return { data: [], error: null };
        return supabase
          .from('parent_reports')
          .select('*, students(id, name, grade)')
          .in('student_id', ids)
          .order('created_at', { ascending: false })
          .limit(5);
      })(),
    ]);

    if (studentsRes.error || logsRes.error) {
      setError('대시보드 데이터를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    const students = (studentsRes.data ?? []) as (Student & { classes?: { name: string } })[];
    const logs = (logsRes.data ?? []) as LessonLog[];
    const todayLogs = logs.filter((l) => l.lesson_date === today);
    const todayClassIds = new Set(todayLogs.map((l) => l.class_id));

    const logsByStudent = new Map<string, LessonLog[]>();
    for (const log of logs) {
      const arr = logsByStudent.get(log.student_id) ?? [];
      arr.push(log);
      logsByStudent.set(log.student_id, arr);
    }

    const attentionStudents = getAttentionStudents(students, logsByStudent);
    const missingHomeworkCount = todayLogs.filter((l) => l.homework_status === 'missing').length;

    let scoreDeclineCount = 0;
    for (const sid of new Set(logs.map((l) => l.student_id))) {
      const t = calculateScoreTrend(logsByStudent.get(sid) ?? []);
      if (t.direction === 'down') scoreDeclineCount++;
    }

    const allHw = calculateHomeworkTrend(logs);
    const gradeBuckets = new Map<string, number[]>();
    for (const log of logs.filter((l) => l.test_score != null).slice(0, 200)) {
      const st = students.find((s) => s.id === log.student_id);
      const g = st?.grade ?? '기타';
      const arr = gradeBuckets.get(g) ?? [];
      arr.push(log.test_score!);
      gradeBuckets.set(g, arr);
    }
    const classScoreTrend = [...gradeBuckets.entries()].map(([name, scores]) => ({
      name,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    const recentActivities = logs.slice(0, 8).map((l) => {
      const st = students.find((s) => s.id === l.student_id);
      return {
        time: l.lesson_date.slice(5).replace('-', '.'),
        text: `${st?.name ?? '학생'} · ${l.unit || '수업'} 기록`,
        type: l.homework_status === 'missing' ? 'homework' : l.test_score != null ? 'test' : 'lesson',
      };
    });

    setStats({
      todayLessonCount: todayLogs.length,
      todayClassCount: todayClassIds.size,
      missingHomeworkCount,
      consultationRecommendedCount: attentionStudents.filter(
        (s) => s.status === 'consultation'
      ).length,
      scoreDeclineCount,
      homeworkTrend: allHw.weeklyRates.map((w) => ({ name: w.week, rate: w.rate })),
      classScoreTrend,
      attentionStudents: attentionStudents.slice(0, 8),
      recentReports: (reportsRes.data ?? []) as ParentReport[],
      recentActivities,
    });
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  return { stats, loading, error, refetch: load };
}
