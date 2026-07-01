'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useStaffScope } from '@/hooks/useStaffScope';
import { fetchLatestRetentionSnapshots } from '@/lib/retentionData';
import {
  getAttentionStudents,
  calculateHomeworkTrend,
  calculateScoreTrend,
} from '@/lib/analytics';
import { buildClassFlows, buildTodayLessons } from '@/lib/classInsights';
import {
  buildActionActivities,
  buildDashboardPriorities,
  getLessonFlowState,
} from '@/lib/learningFlow';
import { buildMorningBrief } from '@/lib/dashboardMorningBrief';
import {
  findCompoundStudentAlert,
  findHighHomeworkClass,
} from '@/lib/dashboardInsights';
import {
  buildAiRecommendations,
  buildTodayChecklist,
} from '@/lib/dashboardOperations';
import {
  buildConsultationCompletionRate,
  buildDailyAttendanceTrend,
  buildStudentCountTrend,
  buildWeeklyAttendanceTrend,
  buildWeeklyCounselingTrend,
} from '@/lib/dashboardTrends';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import type {
  ClassSchedule,
  ConsultationCard,
  ConsultationFollowup,
  CounselingSession,
  DashboardStats,
  DashboardUnclosedLesson,
  LessonLog,
  ParentReport,
  ScheduleException,
  Student,
} from '@/types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDateStr(base: string, days: number) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const STATS_CACHE_TTL_MS = 5 * 60 * 1000;
let statsCache: { key: string; at: number; data: DashboardStats } | null = null;

export function useDashboardStats() {
  const { profile } = useAuth();
  const scope = useStaffScope();
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
    if (scope.loading) return;

    setError(null);
    const academyId = profile.academy_id;
    const today = todayStr();
    const dashboardMode: DashboardStats['dashboardMode'] =
      scope.isTeacher && !scope.isOwner ? 'teacher' : 'owner';

    const cacheKey = `${academyId}:${dataVersion}:${dashboardMode}:${scope.classIds.join(',')}`;
    if (
      statsCache &&
      statsCache.key === cacheKey &&
      Date.now() - statsCache.at < STATS_CACHE_TTL_MS
    ) {
      setStats(statsCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    const teacherClassSet =
      dashboardMode === 'teacher' && scope.classIds.length > 0
        ? new Set(scope.classIds)
        : null;
    const teacherStudentSet =
      dashboardMode === 'teacher' && scope.studentIds.length > 0
        ? new Set(scope.studentIds)
        : null;

    const [studentsRes, logsRes, reportsRes, classesRes, schedulesRes, exceptionsRes, followupsRes, cardsRes, pendingCardsRes, pendingMessagesRes, paymentsRes, counselingRes, unclosedRes, unclosedYesterdayRes, retentionRet, announcementsRes] =
      await Promise.all([
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
      supabase.from('classes').select('id, name, grade').eq('academy_id', academyId),
      supabase
        .from('class_schedules')
        .select('*, classes(id, name, grade)')
        .eq('academy_id', academyId),
      supabase.from('schedule_exceptions').select('*').eq('academy_id', academyId).limit(200),
      supabase
        .from('consultation_followups')
        .select('*')
        .eq('academy_id', academyId)
        .eq('status', 'pending'),
      (async () => {
        const { data: sts } = await supabase
          .from('students')
          .select('id')
          .eq('academy_id', academyId);
        const ids = (sts ?? []).map((s) => s.id);
        if (ids.length === 0) return { data: [], error: null };
        return supabase
          .from('consultation_cards')
          .select('*, students(id, name)')
          .in('student_id', ids)
          .order('created_at', { ascending: false })
          .limit(8);
      })(),
      (async () => {
        const { data: sts } = await supabase
          .from('students')
          .select('id')
          .eq('academy_id', academyId);
        const ids = (sts ?? []).map((s) => s.id);
        if (ids.length === 0) return { data: [], error: null };
        return supabase
          .from('consultation_cards')
          .select('id, consultation_status')
          .in('student_id', ids)
          .eq('consultation_status', 'pending');
      })(),
      supabase
        .from('parent_messages')
        .select('id, created_at')
        .eq('academy_id', academyId)
        .eq('status', 'pending'),
      supabase
        .from('student_payments')
        .select('id, status, due_date')
        .eq('academy_id', academyId)
        .eq('status', 'pending'),
      supabase
        .from('counseling_sessions')
        .select('id, student_id, title, status, scheduled_at, students(id, name)')
        .eq('academy_id', academyId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(100),
      (async () => {
        let q = supabase
          .from('lessons')
          .select('id, class_id, lesson_date, status, classes(name)')
          .eq('academy_id', academyId)
          .eq('lesson_date', today)
          .neq('status', 'closed');
        if (teacherClassSet) q = q.in('class_id', [...teacherClassSet]);
        return q;
      })(),
      (async () => {
        const yesterday = offsetDateStr(today, -1);
        let q = supabase
          .from('lessons')
          .select('id, class_id, lesson_date, status, classes(name)')
          .eq('academy_id', academyId)
          .eq('lesson_date', yesterday)
          .neq('status', 'closed');
        if (teacherClassSet) q = q.in('class_id', [...teacherClassSet]);
        return q;
      })(),
      fetchLatestRetentionSnapshots(academyId),
      supabase
        .from('announcements')
        .select('id, title, published_at')
        .eq('academy_id', academyId)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5),
    ]);

    if (studentsRes.error || logsRes.error) {
      setError('대시보드 데이터를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    let students = (studentsRes.data ?? []) as (Student & { classes?: { name: string } })[];
    if (teacherStudentSet) {
      students = students.filter((s) => teacherStudentSet.has(s.id));
    } else if (teacherClassSet) {
      students = students.filter((s) => s.class_id && teacherClassSet.has(s.class_id));
    }

    const logs = (logsRes.data ?? []) as LessonLog[];
    const scopedLogs =
      teacherStudentSet != null
        ? logs.filter((l) => teacherStudentSet.has(l.student_id))
        : teacherClassSet != null
          ? logs.filter((l) => teacherClassSet.has(l.class_id))
          : logs;
    const todayLogs = scopedLogs.filter((l) => l.lesson_date === today);
    const todayClassIds = new Set(todayLogs.map((l) => l.class_id));

    const logsByStudent = new Map<string, LessonLog[]>();
    for (const log of scopedLogs) {
      const arr = logsByStudent.get(log.student_id) ?? [];
      arr.push(log);
      logsByStudent.set(log.student_id, arr);
    }

    const attentionStudents = getAttentionStudents(students, logsByStudent);
    const missingHomeworkCount = todayLogs.filter((l) => l.homework_status === 'missing').length;
    const absentTodayCount = todayLogs.filter((l) => l.attendance_status === 'absent').length;
    const lateTodayCount = todayLogs.filter((l) => l.attendance_status === 'late').length;
    const presentTodayCount = todayLogs.filter((l) => l.attendance_status === 'present').length;
    const makeupNeededCount = absentTodayCount;

    let scoreDeclineCount = 0;
    for (const sid of new Set(scopedLogs.map((l) => l.student_id))) {
      const t = calculateScoreTrend(logsByStudent.get(sid) ?? []);
      if (t.direction === 'down') scoreDeclineCount++;
    }

    const allHw = calculateHomeworkTrend(scopedLogs);
    const gradeBuckets = new Map<string, number[]>();
    for (const log of scopedLogs.filter((l) => l.test_score != null).slice(0, 200)) {
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

    const cards = (cardsRes.data ?? []) as ConsultationCard[];
    const recentActivities = buildActionActivities({
      logs: scopedLogs,
      cards,
      reports: (reportsRes.data ?? []) as ParentReport[],
      students: students.map((s) => ({ id: s.id, name: s.name })),
      classes: classesRes.data ?? [],
    });

    const schedules = (schedulesRes.data ?? []) as ClassSchedule[];
    const exceptions = (exceptionsRes.data ?? []) as ScheduleException[];
    const followups = (followupsRes.data ?? []) as ConsultationFollowup[];
    const classes = (classesRes.data ?? []).filter(
      (c) => !teacherClassSet || teacherClassSet.has((c as { id: string }).id)
    );
    const weekEvents = expandCalendarEvents(schedules, exceptions, getWeekDates(new Date()));
    let todayLessons = buildTodayLessons(weekEvents, students, scopedLogs, followups, today);
    if (teacherClassSet) {
      todayLessons = todayLessons.filter((tl) => teacherClassSet.has(tl.event.classId));
    }
    const classFlows = buildClassFlows(classes, students, scopedLogs, weekEvents);

    let missingLogLessons = 0;
    for (const tl of todayLessons) {
      const st = getLessonFlowState(tl, today);
      if (st.emphasizeRecord) missingLogLessons++;
    }
    const pendingConsultationCount = (pendingCardsRes.data ?? []).length;

    const todayForPay = todayStr();
    const yesterdayForPay = offsetDateStr(today, -1);
    const pendingPayments = (paymentsRes.data ?? []) as { due_date: string; status: string }[];
    const overduePaymentsCount = pendingPayments.filter(
      (p) => p.status === 'pending' && p.due_date < todayForPay
    ).length;
    const overduePaymentsYesterday = pendingPayments.filter(
      (p) => p.status === 'pending' && p.due_date < yesterdayForPay
    ).length;
    const pendingMsgs = (pendingMessagesRes.data ?? []) as { created_at: string }[];
    const pendingParentMessagesCount = pendingMsgs.length;
    const pendingMsgsNewToday = pendingMsgs.filter(
      (m) => m.created_at.slice(0, 10) === today
    ).length;

    const retentionSignals = retentionRet.signals.filter((row) => {
      if (!teacherStudentSet) return true;
      return teacherStudentSet.has(row.student_id);
    });
    let retentionHighRiskCount = 0;
    const retentionRiskStudents: DashboardStats['retentionRiskStudents'] = [];
    for (const row of retentionSignals) {
      if (row.risk_level === 'high' || row.risk_level === 'medium') {
        if (row.risk_level === 'high') retentionHighRiskCount++;
        retentionRiskStudents.push({
          studentId: row.student_id,
          name: row.students?.name ?? '학생',
          grade: row.students?.grade ?? '',
          reason: row.reason ?? '재등록 상담 검토',
          riskLevel: row.risk_level,
        });
      }
    }
    retentionRiskStudents.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.riskLevel as keyof typeof order] ?? 3) - (order[b.riskLevel as keyof typeof order] ?? 3);
    });

    const counselingSessions = (counselingRes.data ?? []) as unknown as Pick<
      CounselingSession,
      'id' | 'student_id' | 'title' | 'status' | 'scheduled_at' | 'students'
    >[];
    const scopedCounseling = teacherStudentSet
      ? counselingSessions.filter((s) => teacherStudentSet.has(s.student_id))
      : counselingSessions;
    const todayCounselingQueue = scopedCounseling
      .filter((s) => {
        if (s.status !== 'scheduled' && s.status !== 'in_progress') return false;
        if (!s.scheduled_at) return s.status === 'in_progress';
        return s.scheduled_at.slice(0, 10) === today;
      })
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        studentId: s.student_id,
        studentName: (s.students as { name?: string } | undefined)?.name ?? '학생',
        title: s.title,
        status: s.status,
        scheduledAt: s.scheduled_at,
      }));

    const incompleteCounselingCount =
      scopedCounseling.filter((s) => s.status === 'followup_needed').length +
      (pendingConsultationCount > 0 ? pendingConsultationCount : 0);

    const unclosedLessonsToday: DashboardUnclosedLesson[] = (
      (unclosedRes.data ?? []) as {
        id: string;
        class_id: string;
        lesson_date: string;
        status: string;
        classes?: { name?: string } | null;
      }[]
    ).map((row) => ({
      lessonId: row.id,
      classId: row.class_id,
      className: row.classes?.name ?? '반',
      status: row.status,
      lessonDate: row.lesson_date,
    }));

    const yesterday = offsetDateStr(today, -1);
    const yesterdayWeekEvents = expandCalendarEvents(
      schedules,
      exceptions,
      getWeekDates(new Date(`${yesterday}T12:00:00`))
    );
    let yesterdayLessons = buildTodayLessons(
      yesterdayWeekEvents,
      students,
      scopedLogs,
      followups,
      yesterday
    );
    if (teacherClassSet) {
      yesterdayLessons = yesterdayLessons.filter((tl) => teacherClassSet.has(tl.event.classId));
    }
    const unclosedYesterday = (unclosedYesterdayRes.data ?? []) as { status: string }[];
    const yesterdayInProgress = unclosedYesterday.filter((l) => l.status === 'in_progress').length;
    const yesterdayCounseling = scopedCounseling.filter((s) => {
      if (s.status !== 'scheduled' && s.status !== 'in_progress') return false;
      if (!s.scheduled_at) return s.status === 'in_progress';
      return s.scheduled_at.slice(0, 10) === yesterday;
    }).length;

    const kpiDayDeltas: DashboardStats['kpiDayDeltas'] = {
      todayLessonCount: todayLessons.length - yesterdayLessons.length,
      inProgress:
        unclosedLessonsToday.filter((l) => l.status === 'in_progress').length - yesterdayInProgress,
      unclosed: unclosedLessonsToday.length - unclosedYesterday.length,
      counselingToday: todayCounselingQueue.length - yesterdayCounseling,
      overduePayments: overduePaymentsCount - overduePaymentsYesterday,
      pendingParentMessages: pendingMsgsNewToday,
    };

    const worseningStudents = attentionStudents
      .filter((s) => s.riskKind === 'consultation' || s.riskKind === 'makeup' || s.urgency === 'high')
      .slice(0, 6);

    const todayPriorities = buildDashboardPriorities(
      todayLessons,
      attentionStudents.length,
      missingLogLessons,
      {
        consultationCount: attentionStudents.filter((s) => s.status === 'consultation')
          .length,
        pendingConsultationCount,
        pendingParentMessagesCount,
        overduePaymentsCount,
        retentionHighRiskCount,
        missingHomeworkCount,
        absentTodayCount,
        lateTodayCount,
        todayLessonCount: todayLessons.length,
        recentReportCount: (reportsRes.data ?? []).length,
      }
    );

    const weeklyCounselingTrend = buildWeeklyCounselingTrend(scopedCounseling);
    const dailyAttendanceTrend = buildDailyAttendanceTrend(scopedLogs);
    const weeklyAttendanceTrend = buildWeeklyAttendanceTrend(scopedLogs);
    const studentCountTrend = buildStudentCountTrend(scopedLogs);
    const consultationCompletionRate = buildConsultationCompletionRate(scopedCounseling);

    const partialForChecklist = {
      todayLessonCount: todayLessons.length || todayLogs.length,
      todayClassCount: todayLessons.length
        ? new Set(todayLessons.map((t) => t.event.classId)).size
        : todayClassIds.size,
      missingHomeworkCount,
      pendingConsultationCount,
      pendingParentMessagesCount,
      consultationRecommendedCount: attentionStudents.filter(
        (s) => s.status === 'consultation'
      ).length,
      scoreDeclineCount,
      absentTodayCount,
      lateTodayCount,
      presentTodayCount,
      makeupNeededCount,
      pendingAttendanceInputCount: 0,
      pendingHomeworkCheckCount: 0,
      totalStudentCount: students.length,
      homeworkTrend: allHw.weeklyRates.map((w) => ({ name: w.week, rate: w.rate })),
      classScoreTrend,
      weeklyCounselingTrend,
      dailyAttendanceTrend,
      weeklyAttendanceTrend,
      studentCountTrend,
      consultationCompletionRate,
      attentionStudents: attentionStudents.slice(0, 5),
      worseningStudents,
      retentionRiskStudents: retentionRiskStudents.slice(0, 6),
      todayCounselingQueue,
      incompleteCounselingCount,
      recentReports: (reportsRes.data ?? []) as ParentReport[],
      recentActivities,
      todayLessons,
      classFlows,
      todayPriorities,
      morningBriefLines: [] as string[],
      overduePaymentsCount,
      retentionHighRiskCount,
      unclosedLessonsToday,
      dashboardMode,
      kpiDayDeltas,
      todayChecklist: [] as DashboardStats['todayChecklist'],
      aiRecommendations: [] as DashboardStats['aiRecommendations'],
      recentNotices: ((announcementsRes.data ?? []) as { id: string; title: string; published_at: string | null }[]).map(
        (row) => ({
          id: row.id,
          title: row.title,
          publishedAt: row.published_at,
        })
      ),
    };

    partialForChecklist.pendingAttendanceInputCount = missingLogLessons + unclosedLessonsToday.length;
    partialForChecklist.pendingHomeworkCheckCount = missingHomeworkCount;
    partialForChecklist.todayChecklist = buildTodayChecklist(partialForChecklist);
    partialForChecklist.aiRecommendations = buildAiRecommendations(
      attentionStudents,
      worseningStudents,
      retentionRiskStudents
    );

    const classNameMap = new Map(classes.map((c) => [c.id, c.name]));
    const studentNameMap = new Map(students.map((s) => [s.id, s.name]));
    const insightLines = [
      findHighHomeworkClass(scopedLogs, classNameMap),
      findCompoundStudentAlert(scopedLogs, studentNameMap),
    ].filter((l): l is string => Boolean(l));

    partialForChecklist.morningBriefLines = buildMorningBrief({
      ...partialForChecklist,
      insightLines,
    });

    setStats(partialForChecklist);
    statsCache = { key: cacheKey, at: Date.now(), data: partialForChecklist };
    setLoading(false);
  }, [
    profile?.academy_id,
    scope.isTeacher,
    scope.isOwner,
    scope.loading,
    scope.classIds.join(','),
    scope.studentIds.join(','),
    dataVersion,
  ]);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  return { stats, loading, error, refetch: load };
}
