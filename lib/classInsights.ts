import type {
  CalendarLessonEvent,
  ClassFlowSummary,
  LessonLog,
  Student,
  TodayLessonItem,
} from '@/types/database';
import { getAttentionStudents, getRecentUnits, homeworkRateForDate } from '@/lib/analytics';
import { eventsToday, parseTimeToMinutes } from '@/lib/schedules';
import type { ConsultationFollowup } from '@/types/database';

export function buildTodayLessons(
  events: CalendarLessonEvent[],
  students: (Student & { classes?: { name: string } | null })[],
  logs: LessonLog[],
  followups: ConsultationFollowup[],
  today?: string
): TodayLessonItem[] {
  const t = today ?? new Date().toISOString().slice(0, 10);
  const todayEvents = eventsToday(events, t).filter((e) => e.scheduleType !== 'canceled');

  const logsByClass = new Map<string, LessonLog[]>();
  for (const log of logs.filter((l) => l.lesson_date === t)) {
    const arr = logsByClass.get(log.class_id) ?? [];
    arr.push(log);
    logsByClass.set(log.class_id, arr);
  }

  const logsByStudent = new Map<string, LessonLog[]>();
  for (const log of logs) {
    const arr = logsByStudent.get(log.student_id) ?? [];
    arr.push(log);
    logsByStudent.set(log.student_id, arr);
  }

  return todayEvents.map((event) => {
    const classStudents = students.filter((s) => s.class_id === event.classId);
    const attention = getAttentionStudents(classStudents, logsByStudent);
    const followupCount = followups.filter(
      (f) =>
        f.status === 'pending' &&
        classStudents.some((s) => s.id === f.student_id)
    ).length;

    return {
      event,
      studentCount: classStudents.length,
      attentionCount: attention.length,
      followupCount,
      hasLogToday: (logsByClass.get(event.classId)?.length ?? 0) > 0,
    };
  }).sort(
    (a, b) =>
      parseTimeToMinutes(a.event.startTime) - parseTimeToMinutes(b.event.startTime)
  );
}

export function buildClassFlows(
  classes: { id: string; name: string; grade: string }[],
  students: Student[],
  logs: LessonLog[],
  weekEvents: CalendarLessonEvent[]
): ClassFlowSummary[] {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);

  return classes.map((cls) => {
    const classStudents = students.filter((s) => s.class_id === cls.id);
    const classLogs = logs.filter((l) => l.class_id === cls.id);
    const recentLogs = classLogs.filter((l) => l.lesson_date >= cutoff);
    const scored = recentLogs.filter((l) => l.test_score != null);
    const avgScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, l) => s + (l.test_score ?? 0), 0) / scored.length
          )
        : null;

    const logsByStudent = new Map<string, LessonLog[]>();
    for (const log of classLogs) {
      const arr = logsByStudent.get(log.student_id) ?? [];
      arr.push(log);
      logsByStudent.set(log.student_id, arr);
    }
    const attention = getAttentionStudents(
      classStudents.map((s) => ({
        ...s,
        classes: { name: cls.name } as Student['classes'],
      })),
      logsByStudent
    );

    const nextCandidates = weekEvents
      .filter(
        (e) =>
          e.classId === cls.id &&
          e.date >= today &&
          e.scheduleType !== 'canceled'
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      );

    return {
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      avgScore,
      homeworkRate:
        recentLogs.length > 0
          ? Math.round(
              (recentLogs.filter((l) => l.homework_status === 'complete').length /
                recentLogs.length) *
                100
            )
          : 0,
      recentUnit: getRecentUnits(classLogs, 1)[0] ?? null,
      attentionCount: attention.length,
      hasRecentLog: recentLogs.length > 0,
      nextLesson: nextCandidates[0] ?? null,
    };
  });
}

export function getClassPrepData(
  classId: string,
  students: Student[],
  logs: LessonLog[],
  followups: ConsultationFollowup[]
) {
  const classStudents = students.filter((s) => s.class_id === classId);
  const logsByStudent = new Map<string, LessonLog[]>();
  for (const log of logs) {
    if (log.class_id !== classId) continue;
    const arr = logsByStudent.get(log.student_id) ?? [];
    arr.push(log);
    logsByStudent.set(log.student_id, arr);
  }

  const attention = getAttentionStudents(classStudents, logsByStudent);

  const studentNotes = classStudents.map((st) => {
    const sl = (logsByStudent.get(st.id) ?? []).sort(
      (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
    );
    const missing = sl.slice(0, 6).filter((l) => l.homework_status === 'missing').length;
    const lastMemo = sl.find((l) => l.memo?.trim());
    const pendingFu = followups.filter(
      (f) => f.student_id === st.id && f.status === 'pending'
    );
    const att = attention.find((a) => a.id === st.id);
    return {
      student: st,
      missingCount: missing,
      attentionReason: att?.reason,
      followupTitles: pendingFu.map((f) => f.title),
      lastMemo: lastMemo?.memo ?? null,
    };
  });

  const classLogs = logs.filter((l) => l.class_id === classId);
  const recentUnit = getRecentUnits(classLogs, 1)[0] ?? null;
  const lastClassLog = [...classLogs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  )[0];

  return {
    studentNotes,
    attention,
    recentUnit,
    lastClassMemo: lastClassLog?.memo ?? null,
    lastClassDate: lastClassLog?.lesson_date ?? null,
  };
}
