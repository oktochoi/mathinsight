import type {
  AcquisitionSource,
  CalendarLessonEvent,
  GrowthPipelineMetrics,
  IntakeConsultation,
  IntakeNextAction,
  IntakeStatus,
  NotRegisteredReason,
  RegistrationLikelihood,
} from '@/types/database';

export const ACQUISITION_SOURCE_OPTIONS: {
  value: AcquisitionSource;
  label: string;
}[] = [
  { value: 'parent_referral', label: '학부모 소개' },
  { value: 'friend_referral', label: '친구 소개' },
  { value: 'sibling_enrolled', label: '형제·자매 재원' },
  { value: 'naver_search', label: '네이버 검색' },
  { value: 'blog', label: '블로그' },
  { value: 'instagram', label: '인스타그램' },
  { value: 'flyer', label: '전단지' },
  { value: 'banner', label: '현수막' },
  { value: 'walk_in', label: '지나가다가' },
  { value: 'school_referral', label: '학교/지인 추천' },
  { value: 'reregistration', label: '기존 재등록' },
  { value: 'other', label: '기타' },
];

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  scheduled: '예약됨',
  completed: '상담 완료',
  registered: '등록 완료',
  on_hold: '보류',
  not_registered: '미등록',
  no_show: '노쇼',
};

export const INTAKE_STATUS_STYLES: Record<IntakeStatus, string> = {
  scheduled: 'bg-sky-50 text-sky-800 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  registered: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  on_hold: 'bg-amber-50 text-amber-900 border-amber-200',
  not_registered: 'bg-slate-50 text-slate-700 border-slate-200',
  no_show: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const INTAKE_NEXT_ACTION_OPTIONS: { value: IntakeNextAction; label: string }[] = [
  { value: 'follow_up', label: '추가 상담' },
  { value: 'level_test', label: '레벨 테스트' },
  { value: 'trial_lesson', label: '체험 수업' },
  { value: 'enrollment_guide', label: '등록 안내' },
  { value: 'on_hold', label: '보류' },
];

export const NOT_REGISTERED_REASON_OPTIONS: {
  value: NotRegisteredReason;
  label: string;
}[] = [
  { value: 'cost', label: '비용' },
  { value: 'schedule_conflict', label: '시간표 불일치' },
  { value: 'distance', label: '거리' },
  { value: 'competitor', label: '타 학원 선택' },
  { value: 'parent_hold', label: '학부모 보류' },
  { value: 'student_declined', label: '학생 의사' },
  { value: 'other', label: '기타' },
];

export const REGISTRATION_LIKELIHOOD_OPTIONS: {
  value: RegistrationLikelihood;
  label: string;
}[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
];

export function acquisitionSourceLabel(source: string | null | undefined): string {
  if (!source) return '미입력';
  return ACQUISITION_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source;
}

export function notRegisteredReasonLabel(reason: string | null | undefined): string {
  if (!reason) return '—';
  return NOT_REGISTERED_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Growth Pipeline 분석 — Dashboard/Reports 연동용 */
export function aggregateGrowthPipelineMetrics(
  intakes: IntakeConsultation[],
  month?: string
): GrowthPipelineMetrics {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  const rows = intakes.filter((i) => monthKey(i.created_at) === targetMonth);

  const scheduled = rows.filter((r) => r.intake_status !== 'no_show').length;
  const completed = rows.filter((r) =>
    ['completed', 'registered', 'on_hold', 'not_registered'].includes(r.intake_status)
  ).length;
  const registered = rows.filter(
    (r) => r.intake_status === 'registered' || r.registered
  ).length;

  const sourceMap = new Map<string, { count: number; registered: number }>();
  for (const row of rows) {
    const key = row.acquisition_source ?? 'unknown';
    const cur = sourceMap.get(key) ?? { count: 0, registered: 0 };
    cur.count += 1;
    if (row.intake_status === 'registered' || row.registered) cur.registered += 1;
    sourceMap.set(key, cur);
  }

  const reasonMap = new Map<string, number>();
  for (const row of rows) {
    if (row.intake_status !== 'not_registered' || !row.not_registered_reason) continue;
    reasonMap.set(row.not_registered_reason, (reasonMap.get(row.not_registered_reason) ?? 0) + 1);
  }

  return {
    month: targetMonth,
    inquiries: rows.length,
    scheduled,
    completed,
    registered,
    conversionRate: completed > 0 ? Math.round((registered / completed) * 100) : 0,
    bySource: [...sourceMap.entries()]
      .map(([source, stats]) => ({
        source,
        label: acquisitionSourceLabel(source === 'unknown' ? null : source),
        count: stats.count,
        registered: stats.registered,
        rate: stats.count > 0 ? Math.round((stats.registered / stats.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    byNotRegisteredReason: [...reasonMap.entries()]
      .map(([reason, count]) => ({
        reason,
        label: notRegisteredReasonLabel(reason),
        count,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export type IntakeCalendarEvent = {
  kind: 'intake';
  id: string;
  intakeId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  prospectName: string;
  grade: string;
  intakeStatus: IntakeStatus;
  sessionId: string | null;
};

export function intakeToCalendarEvents(
  intakes: IntakeConsultation[],
  weekDates: string[],
  durationMinutes = 60
): IntakeCalendarEvent[] {
  const weekSet = new Set(weekDates);
  const events: IntakeCalendarEvent[] = [];

  for (const intake of intakes) {
    const scheduledAt = intake.counseling_sessions?.scheduled_at;
    if (!scheduledAt) continue;
    const d = new Date(scheduledAt);
    const date = d.toISOString().slice(0, 10);
    if (!weekSet.has(date)) continue;

    const startMin = d.getHours() * 60 + d.getMinutes();
    const endMin = startMin + durationMinutes;
    const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    events.push({
      kind: 'intake',
      id: `intake-${intake.id}`,
      intakeId: intake.id,
      date,
      startTime,
      endTime,
      title: `신입 상담 · ${intake.prospect_name}`,
      prospectName: intake.prospect_name,
      grade: intake.grade,
      intakeStatus: intake.intake_status,
      sessionId: intake.counseling_session_id,
    });
  }

  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime)
  );
}

export type CalendarSlotItem =
  | { kind: 'lesson'; event: CalendarLessonEvent }
  | { kind: 'intake'; event: IntakeCalendarEvent };

export interface CalendarTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  items: CalendarSlotItem[];
  lessonCount: number;
  intakeCount: number;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function itemTimeRange(item: CalendarSlotItem): { start: number; end: number } {
  if (item.kind === 'lesson') {
    return {
      start: parseTimeToMinutes(item.event.startTime),
      end: parseTimeToMinutes(item.event.endTime),
    };
  }
  return {
    start: parseTimeToMinutes(item.event.startTime),
    end: parseTimeToMinutes(item.event.endTime),
  };
}

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return a.start < b.end && b.start < a.end;
}

/** 같은 시간대 수업·상담을 하나의 슬롯으로 묶음 */
export function buildCalendarTimeSlots(
  lessons: CalendarLessonEvent[],
  intakes: IntakeCalendarEvent[]
): CalendarTimeSlot[] {
  const byDate = new Map<string, CalendarSlotItem[]>();

  for (const event of lessons) {
    if (event.scheduleType === 'canceled') continue;
    const items = byDate.get(event.date) ?? [];
    items.push({ kind: 'lesson', event });
    byDate.set(event.date, items);
  }

  for (const event of intakes) {
    const items = byDate.get(event.date) ?? [];
    items.push({ kind: 'intake', event });
    byDate.set(event.date, items);
  }

  const slots: CalendarTimeSlot[] = [];

  for (const [date, items] of byDate) {
    const sorted = [...items].sort(
      (a, b) => itemTimeRange(a).start - itemTimeRange(b).start
    );

    const groups: { start: number; end: number; items: CalendarSlotItem[] }[] = [];

    for (const item of sorted) {
      const range = itemTimeRange(item);
      const overlapping = groups.filter((g) => rangesOverlap(range, g));
      if (overlapping.length === 0) {
        groups.push({ start: range.start, end: range.end, items: [item] });
        continue;
      }

      const mergedStart = Math.min(range.start, ...overlapping.map((g) => g.start));
      const mergedEnd = Math.max(range.end, ...overlapping.map((g) => g.end));
      const mergedItems = [...overlapping.flatMap((g) => g.items), item];

      for (const g of overlapping) {
        const idx = groups.indexOf(g);
        if (idx >= 0) groups.splice(idx, 1);
      }
      groups.push({ start: mergedStart, end: mergedEnd, items: mergedItems });
    }

    for (const group of groups) {
      const lessonCount = group.items.filter((i) => i.kind === 'lesson').length;
      const intakeCount = group.items.filter((i) => i.kind === 'intake').length;
      slots.push({
        id: `slot-${date}-${group.start}`,
        date,
        startTime: minutesToTime(group.start),
        endTime: minutesToTime(group.end),
        items: group.items,
        lessonCount,
        intakeCount,
      });
    }
  }

  return slots.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime)
  );
}
