import type {
  LessonLog,
  Student,
  StudentStatus,
  AttentionStudent,
  HomeworkStatus,
} from '@/types/database';
export type TrendDirection = 'up' | 'down' | 'stable' | 'insufficient';

export interface ScoreTrend {
  direction: TrendDirection;
  recentAvg: number | null;
  previousAvg: number | null;
  delta: number | null;
  points: { date: string; score: number }[];
}

export interface HomeworkTrend {
  direction: TrendDirection;
  recentRate: number;
  previousRate: number;
  weeklyRates: { week: string; rate: number }[];
}

const MS_DAY = 86400000;

function sortLogs(logs: LessonLog[]): LessonLog[] {
  return [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
}

function logsInRange(logs: LessonLog[], start: string, end: string): LessonLog[] {
  return logs.filter((l) => l.lesson_date >= start && l.lesson_date <= end);
}

export function calculateScoreTrend(logs: LessonLog[], limit = 8): ScoreTrend {
  const scored = sortLogs(logs).filter((l) => l.test_score != null);
  const points = scored
    .slice(0, limit)
    .reverse()
    .map((l) => ({ date: l.lesson_date.slice(5).replace('-', '.'), score: l.test_score! }));

  if (scored.length < 2) {
    return {
      direction: 'insufficient',
      recentAvg: scored[0]?.test_score ?? null,
      previousAvg: null,
      delta: null,
      points,
    };
  }

  const recent = scored.slice(0, Math.min(3, scored.length));
  const previous = scored.slice(3, Math.min(6, scored.length));
  const recentAvg =
    recent.reduce((s, l) => s + (l.test_score ?? 0), 0) / recent.length;
  const previousAvg =
    previous.length > 0
      ? previous.reduce((s, l) => s + (l.test_score ?? 0), 0) / previous.length
      : recentAvg;
  const delta = Math.round(recentAvg - previousAvg);

  let direction: TrendDirection = 'stable';
  if (delta <= -8) direction = 'down';
  else if (delta >= 5) direction = 'up';

  return { direction, recentAvg: Math.round(recentAvg), previousAvg: Math.round(previousAvg), delta, points };
}

export function calculateHomeworkTrend(logs: LessonLog[], weeks = 5): HomeworkTrend {
  const sorted = sortLogs(logs);
  const now = new Date();
  const weeklyRates: { week: string; rate: number }[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now.getTime() - w * 7 * MS_DAY);
    const start = new Date(end.getTime() - 6 * MS_DAY);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const weekLogs = logsInRange(sorted, startStr, endStr);
    if (weekLogs.length === 0) {
      weeklyRates.push({ week: `${weeks - w}주`, rate: 0 });
      continue;
    }
    const complete = weekLogs.filter((l) => l.homework_status === 'complete').length;
    weeklyRates.push({
      week: `${weeks - w}주`,
      rate: Math.round((complete / weekLogs.length) * 100),
    });
  }

  const recent = sorted.slice(0, 5);
  const previous = sorted.slice(5, 10);
  const rate = (list: LessonLog[]) =>
    list.length === 0
      ? 0
      : list.filter((l) => l.homework_status === 'complete').length / list.length;

  const recentRate = Math.round(rate(recent) * 100);
  const previousRate = Math.round(rate(previous) * 100);
  const diff = recentRate - previousRate;

  let direction: TrendDirection = 'stable';
  if (diff <= -15) direction = 'down';
  else if (diff >= 15) direction = 'up';

  return { direction, recentRate, previousRate, weeklyRates };
}

export function getRepeatedTags(logs: LessonLog[], minCount = 2): string[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    for (const tag of log.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

export function getRecentUnits(logs: LessonLog[], limit = 5): string[] {
  const seen = new Set<string>();
  const units: string[] = [];
  for (const log of sortLogs(logs)) {
    const u = log.unit?.trim();
    if (u && !seen.has(u)) {
      seen.add(u);
      units.push(u);
      if (units.length >= limit) break;
    }
  }
  return units;
}

export function countMissingHomework(logs: LessonLog[], days = 14): number {
  const cutoff = new Date(Date.now() - days * MS_DAY).toISOString().slice(0, 10);
  return logs.filter(
    (l) => l.lesson_date >= cutoff && l.homework_status === 'missing'
  ).length;
}

/** @deprecated use deriveStudentStatusFromRisk from @/lib/studentRisk */
export function deriveStudentStatus(logs: LessonLog[]): StudentStatus {
  const recent = sortLogs(logs).slice(0, 8);
  if (recent.length === 0) return 'stable';
  const missing = recent.filter((l) => l.homework_status === 'missing').length;
  const scoreTrend = calculateScoreTrend(recent);
  if (missing >= 2 || scoreTrend.direction === 'down') return 'consultation';
  if (missing >= 1) return 'attention';
  return 'stable';
}

export { getAttentionStudents, buildAttentionReason } from '@/lib/attentionStudents';

export function homeworkRateForDate(logs: LessonLog[], date: string): number {
  const dayLogs = logs.filter((l) => l.lesson_date === date);
  if (dayLogs.length === 0) return 0;
  const ok = dayLogs.filter(
    (l) => l.homework_status === 'complete' || l.homework_status === 'partial'
  ).length;
  return Math.round((ok / dayLogs.length) * 100);
}

export function formatHomeworkStatus(status: HomeworkStatus): string {
  const map: Record<HomeworkStatus, string> = {
    complete: '완료',
    partial: '부분',
    missing: '미제출',
  };
  return map[status];
}
