import type {
  ActionActivity,
  CalendarLessonEvent,
  ConsultationCard,
  ConsultationFollowup,
  DashboardPriority,
  LessonLog,
  TodayLessonItem,
} from '@/types/database';
import {
  calculateHomeworkTrend,
  calculateScoreTrend,
  getRepeatedTags,
} from '@/lib/analytics';
import { parseTimeToMinutes } from '@/lib/schedules';
import { HOMEWORK_LABELS } from '@/lib/statusLabels';

export type FlowBadgeTone = 'success' | 'warning' | 'info' | 'muted' | 'danger';

export interface FlowBadge {
  key: string;
  label: string;
  tone: FlowBadgeTone;
}

export type LessonTiming = 'canceled' | 'ended' | 'starting_soon' | 'in_progress' | 'upcoming';

export interface LessonFlowState {
  timing: LessonTiming;
  badges: FlowBadge[];
  emphasizeRecord: boolean;
  minutesUntilStart: number | null;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function eventWindow(event: CalendarLessonEvent, date: string): {
  startMin: number;
  endMin: number;
} {
  return {
    startMin: parseTimeToMinutes(event.startTime),
    endMin: parseTimeToMinutes(event.endTime),
  };
}

export function getLessonFlowState(
  item: TodayLessonItem,
  date: string = new Date().toISOString().slice(0, 10)
): LessonFlowState {
  const { event, hasLogToday, attentionCount, followupCount } = item;
  const badges: FlowBadge[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const isToday = event.date === today;

  if (event.scheduleType === 'canceled') {
    return {
      timing: 'canceled',
      badges: [{ key: 'canceled', label: '휴강', tone: 'muted' }],
      emphasizeRecord: false,
      minutesUntilStart: null,
    };
  }

  if (event.scheduleType === 'makeup') {
    badges.push({ key: 'makeup', label: '보강', tone: 'info' });
  }

  let timing: LessonTiming = 'upcoming';
  let minutesUntilStart: number | null = null;

  if (isToday) {
    const now = nowMinutes();
    const { startMin, endMin } = eventWindow(event, date);
    minutesUntilStart = startMin - now;
    if (now >= endMin) timing = 'ended';
    else if (now >= startMin) timing = 'in_progress';
    else if (minutesUntilStart <= 60 && minutesUntilStart > 0) timing = 'starting_soon';
    else timing = 'upcoming';
  }

  if (hasLogToday) {
    badges.push({ key: 'logged', label: '기록 완료', tone: 'success' });
  } else if (timing === 'ended' || (isToday && timing !== 'upcoming' && timing !== 'starting_soon')) {
    badges.push({ key: 'no_log', label: '기록 미입력', tone: 'warning' });
  }

  if (attentionCount > 0 && timing !== 'ended') {
    badges.push({
      key: 'prep',
      label: '준비 필요',
      tone: 'warning',
    });
  }

  if (followupCount > 0) {
    badges.push({
      key: 'followup',
      label: `상담 ${followupCount}건`,
      tone: 'info',
    });
  }

  const emphasizeRecord = timing === 'ended' && !hasLogToday;

  return { timing, badges, emphasizeRecord, minutesUntilStart };
}

function logsInRange(logs: LessonLog[], start: string, end: string): LessonLog[] {
  return logs.filter((l) => l.lesson_date >= start && l.lesson_date <= end);
}

function homeworkRate(logs: LessonLog[]): number {
  if (logs.length === 0) return 0;
  return Math.round(
    (logs.filter((l) => l.homework_status === 'complete').length / logs.length) * 100
  );
}

export interface PeriodChange {
  label: string;
  value: string;
  direction: 'up' | 'down' | 'stable' | 'neutral';
}

export function buildStudentPeriodChanges(logs: LessonLog[]): PeriodChange[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime()
  );
  const recent = sorted.slice(0, 8);
  const previous = sorted.slice(8, 16);
  const changes: PeriodChange[] = [];

  const scoreRecent = calculateScoreTrend(recent);
  const scorePrev = calculateScoreTrend(previous);
  if (
    scoreRecent.recentAvg != null &&
    scorePrev.recentAvg != null &&
    recent.length >= 2 &&
    previous.length >= 1
  ) {
    const delta = scoreRecent.recentAvg - scorePrev.recentAvg;
    if (delta !== 0) {
      changes.push({
        label: '시험 평균',
        value: delta > 0 ? `+${delta}점` : `${delta}점`,
        direction: delta > 0 ? 'up' : 'down',
      });
    }
  }

  const hwRecent = homeworkRate(recent);
  const hwPrev = homeworkRate(previous);
  if (recent.length > 0 && previous.length > 0 && hwRecent !== hwPrev) {
    const diff = hwRecent - hwPrev;
    changes.push({
      label: '숙제 제출률',
      value: diff > 0 ? `+${diff}%` : `${diff}%`,
      direction: diff > 0 ? 'up' : 'down',
    });
  }

  return changes;
}

export function buildStudentFlowSummary(
  logs: LessonLog[],
  followups: ConsultationFollowup[] = []
): string {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const cutoff = fourWeeksAgo.toISOString().slice(0, 10);
  const recent = logs.filter((l) => l.lesson_date >= cutoff);

  if (recent.length === 0) {
    return '최근 4주 수업 기록이 아직 없습니다.';
  }

  const hw = calculateHomeworkTrend(recent);
  const score = calculateScoreTrend(recent);
  const tags = getRepeatedTags(recent, 2);
  const pendingFu = followups.filter((f) => f.status === 'pending');
  const lines: string[] = [];

  if (hw.recentRate >= 80) {
    lines.push('최근 숙제 제출률이 안정적인 편입니다(기록 기준).');
  } else if (hw.direction === 'down') {
    lines.push('최근 숙제 제출 기록이 이전보다 줄었습니다.');
  } else if (recent.filter((l) => l.homework_status === 'missing').length >= 2) {
    lines.push('최근 숙제 미제출 기록이 여러 번 있습니다.');
  }

  if (score.direction === 'down' && score.delta != null) {
    lines.push('최근 시험 점수 변화가 기록에 나타납니다.');
  } else if (score.direction === 'up' && score.delta != null) {
    lines.push('최근 시험 점수가 이전보다 올라간 기록이 있습니다.');
  }

  if (tags.length > 0) {
    lines.push(`최근 특정 단원·메모 태그(${tags.slice(0, 2).join(', ')})가 반복되고 있습니다.`);
  }

  if (pendingFu.length > 0) {
    lines.push(`지난 상담 이후 확인할 항목이 ${pendingFu.length}건 남아 있습니다.`);
  } else if (lines.length === 0) {
    lines.push('최근 4주 기록 기준 뚜렷한 변화 패턴은 없습니다.');
  }

  return lines.slice(0, 2).join(' ');
}

export function buildPostConsultationChanges(
  logs: LessonLog[],
  lastCard: ConsultationCard | undefined,
  followups: ConsultationFollowup[]
): string[] {
  if (!lastCard && followups.length === 0) return [];

  const anchorDate =
    lastCard?.created_at.slice(0, 10) ??
    followups[0]?.created_at.slice(0, 10) ??
    '';
  if (!anchorDate) return [];

  const since = logs.filter((l) => l.lesson_date >= anchorDate);
  const before = logs.filter((l) => l.lesson_date < anchorDate);
  const recentSlice = since.slice(0, 6);
  const beforeSlice = before.slice(0, 6);

  const notes: string[] = [];
  const hwSince = homeworkRate(recentSlice);
  const hwBefore = homeworkRate(beforeSlice);
  if (recentSlice.length > 0 && beforeSlice.length > 0) {
    if (hwSince > hwBefore + 10) notes.push('숙제 제출 기록이 늘었습니다.');
    else if (hwSince < hwBefore - 10) notes.push('숙제 미제출 기록이 이전보다 많습니다.');
    else notes.push('숙제 제출 패턴이 비슷합니다.');
  }

  const scoreSince = calculateScoreTrend(recentSlice);
  if (scoreSince.direction === 'up') notes.push('최근 점수가 안정·상승 흐름입니다(기록).');
  else if (scoreSince.direction === 'down')
    notes.push('최근 점수 하락 흐름이 기록에 있습니다.');
  else if (recentSlice.length > 0) notes.push('최근 점수 변화는 크지 않습니다(기록).');

  const tags = getRepeatedTags(recentSlice, 2);
  if (tags.length > 0) notes.push(`동일 메모·태그가 반복됩니다: ${tags.join(', ')}`);

  return notes.slice(0, 3);
}

export function buildDashboardPriorities(
  todayLessons: TodayLessonItem[],
  attentionCount: number,
  missingLogLessons: number,
  summary?: {
    consultationCount: number;
    pendingConsultationCount?: number;
    pendingParentMessagesCount?: number;
    overduePaymentsCount?: number;
    retentionHighRiskCount?: number;
    missingHomeworkCount: number;
    absentTodayCount?: number;
    lateTodayCount?: number;
    todayLessonCount: number;
    recentReportCount: number;
  }
): DashboardPriority[] {
  const items: DashboardPriority[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (summary) {
    if ((summary.absentTodayCount ?? 0) > 0) {
      items.push({
        id: 'attendance-absent',
        text: `오늘 결석 ${summary.absentTodayCount}명 → 출결 관리`,
        href: '/attendance',
        tone: 'danger',
      });
    }
    if ((summary.lateTodayCount ?? 0) > 0) {
      items.push({
        id: 'attendance-late',
        text: `오늘 지각 ${summary.lateTodayCount}명 → 출결 관리`,
        href: '/attendance',
        tone: 'warning',
      });
    }
    if (summary.missingHomeworkCount > 0) {
      items.push({
        id: 'homework-missing',
        text: `오늘 숙제 미제출 ${summary.missingHomeworkCount}명 → 숙제 관리`,
        href: '/homework?filter=missing',
        tone: 'warning',
      });
    }
    if ((summary.pendingParentMessagesCount ?? 0) > 0) {
      items.push({
        id: 'parent-messages',
        text: `학부모 문의 대기 ${summary.pendingParentMessagesCount}건 → 문의함`,
        href: '/messages',
        tone: 'warning',
      });
    }
    if ((summary.pendingConsultationCount ?? 0) > 0) {
      items.push({
        id: 'consult-pending',
        text: `상담 대기 ${summary.pendingConsultationCount}건 → 상담 관리`,
        href: '/counseling',
        tone: 'warning',
      });
    }
    if ((summary.overduePaymentsCount ?? 0) > 0) {
      items.push({
        id: 'payments-overdue',
        text: `수강료 연체 ${summary.overduePaymentsCount}건 → 결제 관리`,
        href: '/billing',
        tone: 'danger',
      });
    }
    if ((summary.retentionHighRiskCount ?? 0) > 0) {
      items.push({
        id: 'retention-high',
        text: `상담 권장 ${summary.retentionHighRiskCount}명 → 학생 성장`,
        href: '/retention',
        tone: 'danger',
      });
    }
    if (summary.consultationCount > 0) {
      items.push({
        id: 'consult-recommended',
        text: `상담 검토 ${summary.consultationCount}명 → 학생 관리`,
        href: '/students',
        tone: 'warning',
      });
    }
    if (summary.todayLessonCount > 0) {
      items.push({
        id: 'today-lessons',
        text: `오늘 수업 ${summary.todayLessonCount}개 → 시간표`,
        href: '/schedule',
        tone: 'info',
      });
    }
    if (summary.recentReportCount > 0) {
      items.push({
        id: 'recent-reports',
        text: `저장된 리포트 ${summary.recentReportCount}건`,
        href: '/parent-reports',
        tone: 'info',
      });
    }
  }

  for (const lesson of todayLessons) {
    const state = getLessonFlowState(lesson, today);
    if (state.timing === 'starting_soon' && state.minutesUntilStart != null) {
      items.push({
        id: `soon-${lesson.event.id}`,
        text: `${lesson.event.className} 수업 ${state.minutesUntilStart}분 전`,
        href: `/schedule/prep?classId=${lesson.event.classId}&date=${today}`,
        tone: 'warning',
      });
    }
  }

  if (!summary && attentionCount > 0) {
    items.push({
      id: 'attention',
      text: `상담·확인 참고 학생 ${attentionCount}명`,
      href: '/students',
      tone: 'info',
    });
  } else if (summary && attentionCount > summary.consultationCount) {
    items.push({
      id: 'attention',
      text: `확인 참고 학생 ${attentionCount}명`,
      href: '/students',
      tone: 'info',
    });
  }

  if (missingLogLessons > 0) {
    items.push({
      id: 'missing-log',
      text: `기록 미입력 수업 ${missingLogLessons}개`,
      href: '/schedule',
      tone: 'warning',
    });
  }

  return items.slice(0, 8);
}

export function buildActionActivities(input: {
  logs: LessonLog[];
  cards: ConsultationCard[];
  reports: { id: string; created_at: string; students?: { name?: string } | null }[];
  students: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}): ActionActivity[] {
  const activities: (ActionActivity & { sortKey: string })[] = [];

  const logsByClassDate = new Map<string, LessonLog[]>();
  for (const log of input.logs.slice(0, 100)) {
    const key = `${log.class_id}:${log.lesson_date}`;
    const arr = logsByClassDate.get(key) ?? [];
    arr.push(log);
    logsByClassDate.set(key, arr);
  }
  for (const [key, dayLogs] of logsByClassDate) {
    const [classId, date] = key.split(':');
    const cls = input.classes.find((c) => c.id === classId);
    activities.push({
      time: date.slice(5).replace('-', '.'),
      text: `${cls?.name ?? '반'} 기록 입력 완료`,
      type: 'lesson',
      sortKey: `${date}T12:00:00`,
    });
  }

  for (const c of input.cards.slice(0, 5)) {
    const name = (c.students as { name?: string })?.name ?? '학생';
    activities.push({
      time: c.created_at.slice(5, 10).replace('-', '.'),
      text: `${name} 상담 카드 생성`,
      type: 'consult',
      sortKey: c.created_at,
    });
  }

  for (const r of input.reports.slice(0, 5)) {
    const name = r.students?.name ?? '학생';
    activities.push({
      time: r.created_at.slice(5, 10).replace('-', '.'),
      text: `${name} 학부모 리포트 저장`,
      type: 'report',
      sortKey: r.created_at,
    });
  }

  return activities
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, 10)
    .map(({ sortKey: _s, ...rest }) => rest as ActionActivity);
}

export function buildParentRecentChanges(logs: LessonLog[]): string[] {
  const changes = buildStudentPeriodChanges(logs);
  if (changes.length === 0) {
    const hw = calculateHomeworkTrend(logs);
    if (logs.length > 0 && hw.recentRate >= 70) {
      return ['숙제 제출이 비교적 안정적입니다(기록).'];
    }
    return ['최근 기록을 바탕으로 변화를 정리 중입니다.'];
  }
  return changes.map((c) => {
    if (c.label === '시험 평균') return `최근 시험 ${c.value}(기록)`;
    if (c.label === '숙제 제출률') return `숙제 제출률 ${c.value}(기록)`;
    return `${c.label} ${c.value}`;
  });
}

export function buildRecentLessonSummaries(
  logs: LessonLog[],
  limit = 4
): { date: string; unit: string; homework: string; memo: string | null }[] {
  return [...logs]
    .sort((a, b) => b.lesson_date.localeCompare(a.lesson_date))
    .slice(0, limit)
    .map((l) => ({
      date: l.lesson_date,
      unit: l.unit || '수업',
      homework: HOMEWORK_LABELS[l.homework_status] ?? l.homework_status,
      memo:
        l.memo?.trim() ||
        (l.tags?.length ? l.tags.join(', ') : null),
    }));
}
