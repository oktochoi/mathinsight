import type { ClassSchedule, ScheduleException } from '@/types/database';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';

/** Google Calendar / Outlook 구독용 ICS (2주) */
export function buildAcademyIcsFeed(
  academyName: string,
  schedules: ClassSchedule[],
  exceptions: ScheduleException[]
): string {
  const week1 = getWeekDates(new Date());
  const week2Start = new Date();
  week2Start.setDate(week2Start.getDate() + 7);
  const week2 = getWeekDates(week2Start);
  const events = expandCalendarEvents(schedules, exceptions, [...week1, ...week2]);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduFlow//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(academyName)} 수업`,
  ];

  for (const ev of events) {
    if (ev.scheduleType === 'canceled') continue;
    const uid = `${ev.id}@eduflow`;
    const dtStart = toIcsDateTime(ev.date, ev.startTime);
    const dtEnd = toIcsDateTime(ev.date, ev.endTime);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatUtcNow()}`,
      `DTSTART;TZID=Asia/Seoul:${dtStart}`,
      `DTEND;TZID=Asia/Seoul:${dtEnd}`,
      `SUMMARY:${escapeIcs(`${ev.className} · ${ev.title}`)}`,
      `DESCRIPTION:${escapeIcs(ev.classGrade)}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toIcsDateTime(date: string, time: string): string {
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split(':');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function formatUtcNow(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
