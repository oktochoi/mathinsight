import type {
  CalendarLessonEvent,
  ClassSchedule,
  ScheduleException,
  ScheduleType,
} from '@/types/database';
import { DAY_LABELS } from '@/lib/scheduleLabels';

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getWeekDates(anchor: Date): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => dateStr(addDays(start, i)));
}

export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

type ScheduleWithMeta = ClassSchedule & {
  classes?: { id: string; name: string; grade: string } | null;
  teacher?: { id: string; name: string } | null;
};

export function expandCalendarEvents(
  schedules: ScheduleWithMeta[],
  exceptions: ScheduleException[],
  weekDates: string[]
): CalendarLessonEvent[] {
  const events: CalendarLessonEvent[] = [];
  const exByScheduleDate = new Map<string, ScheduleException>();
  const exByClassDate = new Map<string, ScheduleException[]>();

  for (const ex of exceptions) {
    const key = ex.class_schedule_id
      ? `${ex.class_schedule_id}:${ex.exception_date}`
      : null;
    if (key) exByScheduleDate.set(key, ex);
    const ck = `${ex.class_id}:${ex.exception_date}`;
    const arr = exByClassDate.get(ck) ?? [];
    arr.push(ex);
    exByClassDate.set(ck, arr);
  }

  for (const date of weekDates) {
    const d = new Date(date + 'T12:00:00');
    const dow = d.getDay();

    for (const sch of schedules) {
      if (!sch.is_recurring && sch.schedule_type === 'canceled') continue;
      if (sch.day_of_week !== dow) continue;

      const exKey = `${sch.id}:${date}`;
      const ex = exByScheduleDate.get(exKey);

      if (ex?.exception_type === 'canceled') {
        events.push(buildEvent(sch, date, 'canceled', sch.start_time, sch.end_time, ex));
        continue;
      }

      if (ex?.exception_type === 'time_changed' && ex.start_time && ex.end_time) {
        events.push(
          buildEvent(sch, date, sch.schedule_type, ex.start_time, ex.end_time, ex)
        );
        continue;
      }

      events.push(buildEvent(sch, date, sch.schedule_type, sch.start_time, sch.end_time, ex));
    }

    for (const ex of exceptions.filter(
      (e) => e.exception_date === date && !e.class_schedule_id
    )) {
      if (ex.exception_type !== 'makeup' && ex.exception_type !== 'special') continue;
      const sch = schedules.find((s) => s.class_id === ex.class_id);
      const start = ex.start_time ?? sch?.start_time ?? '09:00';
      const end = ex.end_time ?? sch?.end_time ?? '10:00';
      events.push({
        id: `ex-${ex.id}`,
        scheduleId: null,
        exceptionId: ex.id,
        classId: ex.class_id,
        className: sch?.classes?.name ?? '반',
        classGrade: sch?.classes?.grade ?? '',
        title: ex.exception_type === 'makeup' ? '보강' : ex.memo?.slice(0, 20) || '특강',
        date,
        dayOfWeek: dow,
        startTime: start,
        endTime: end,
        scheduleType: ex.exception_type === 'makeup' ? 'makeup' : 'special',
        location: sch?.location ?? null,
        memo: ex.memo,
        teacherName: sch?.teacher?.name ?? null,
        isVisibleToParent: ex.is_visible_to_parent,
      });
    }
  }

  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  );
}

function buildEvent(
  sch: ScheduleWithMeta,
  date: string,
  type: ScheduleType,
  start: string,
  end: string,
  ex: ScheduleException | undefined
): CalendarLessonEvent {
  const d = new Date(date + 'T12:00:00');
  return {
    id: ex ? `ex-${ex.id}` : `sch-${sch.id}-${date}`,
    scheduleId: sch.id,
    exceptionId: ex?.id ?? null,
    classId: sch.class_id,
    className: sch.classes?.name ?? '반',
    classGrade: sch.classes?.grade ?? '',
    title: sch.title,
    date,
    dayOfWeek: d.getDay(),
    startTime: start,
    endTime: end,
    scheduleType: type,
    location: sch.location,
    memo: ex?.memo ?? sch.memo,
    teacherName: sch.teacher?.name ?? null,
    isVisibleToParent: sch.is_visible_to_parent,
  };
}

export function eventsForDate(events: CalendarLessonEvent[], date: string): CalendarLessonEvent[] {
  return events.filter((e) => e.date === date && e.scheduleType !== 'canceled');
}

export function eventsToday(events: CalendarLessonEvent[], today?: string): CalendarLessonEvent[] {
  const t = today ?? dateStr(new Date());
  return eventsForDate(events, t);
}

export function dayLabel(dow: number): string {
  return DAY_LABELS[dow] ?? '';
}
