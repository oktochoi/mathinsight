import type { DashboardWeeklyPoint, LessonLog } from '@/types/database';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function buildWeeklyCounselingTrend(
  sessions: { scheduled_at: string | null; status: string }[],
  days = 7
): DashboardWeeklyPoint[] {
  const now = new Date();
  const points: DashboardWeeklyPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = i === 0 ? '오늘' : DAY_LABELS[d.getDay()];
    const count = sessions.filter((s) => {
      if (!s.scheduled_at || s.status === 'cancelled') return false;
      return s.scheduled_at.slice(0, 10) === dateStr;
    }).length;
    points.push({ name: label, count });
  }

  return points;
}

export function buildDailyAttendanceTrend(logs: LessonLog[], days = 7): DashboardWeeklyPoint[] {
  const now = new Date();
  const points: DashboardWeeklyPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = i === 0 ? '오늘' : DAY_LABELS[d.getDay()];
    const dayLogs = logs.filter((l) => l.lesson_date === dateStr);
    if (dayLogs.length === 0) {
      points.push({ name: label, rate: 0 });
      continue;
    }
    const present = dayLogs.filter(
      (l) => l.attendance_status === 'present' || l.attendance_status === 'late'
    ).length;
    points.push({ name: label, rate: Math.round((present / dayLogs.length) * 100) });
  }

  return points;
}

export function buildWeeklyAttendanceTrend(logs: LessonLog[], weeks = 5): DashboardWeeklyPoint[] {
  const now = new Date();
  const points: DashboardWeeklyPoint[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now.getTime() - w * 7 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const weekLogs = logs.filter((l) => l.lesson_date >= startStr && l.lesson_date <= endStr);
    if (weekLogs.length === 0) {
      points.push({ name: `${weeks - w}주`, rate: 0 });
      continue;
    }
    const present = weekLogs.filter(
      (l) => l.attendance_status === 'present' || l.attendance_status === 'late'
    ).length;
    points.push({
      name: `${weeks - w}주`,
      rate: Math.round((present / weekLogs.length) * 100),
    });
  }

  return points;
}

export function buildStudentCountTrend(
  logs: { student_id: string; lesson_date: string }[],
  weeks = 5
): DashboardWeeklyPoint[] {
  const now = new Date();
  const points: DashboardWeeklyPoint[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now.getTime() - w * 7 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const ids = new Set(
      logs
        .filter((l) => l.lesson_date >= startStr && l.lesson_date <= endStr)
        .map((l) => l.student_id)
    );
    points.push({ name: `${weeks - w}주`, count: ids.size });
  }

  return points;
}

export function buildConsultationCompletionRate(
  sessions: { status: string }[]
): number {
  if (sessions.length === 0) return 0;
  const done = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'closed'
  ).length;
  return Math.round((done / sessions.length) * 100);
}
