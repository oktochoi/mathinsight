'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useClassSchedules } from '@/hooks/useClassSchedules';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useClasses } from '@/hooks/useClasses';
import { expandCalendarEvents, getWeekDates, dayLabel } from '@/lib/schedules';
import { buildTodayLessons, getClassPrepData } from '@/lib/classInsights';
import { LessonFlowCard } from '@/components/flow/LessonFlowCard';
import { getLessonFlowState } from '@/lib/learningFlow';
import { FlowBadgeRow } from '@/components/flow/FlowBadgeRow';
import { getAttentionStudents } from '@/lib/analytics';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_STYLES,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import { ScheduleEventChip, ScheduleTypeLegend } from '@/components/schedules/ScheduleEventChip';
import type { CalendarLessonEvent, ScheduleType } from '@/types/database';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'regular', label: '정기수업' },
  { value: 'makeup', label: '보강' },
  { value: 'special', label: '특강' },
  { value: 'canceled', label: '휴강' },
];

export default function SchedulePage() {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<CalendarLessonEvent | null>(null);

  const { schedules, exceptions, loading } = useClassSchedules();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { logs, loading: logsLoading } = useLessonLogs({ limit: 500 });
  const { followups } = useConsultationFollowups();

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const allEvents = useMemo(
    () => expandCalendarEvents(schedules, exceptions, weekDates),
    [schedules, exceptions, weekDates]
  );

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (classFilter !== 'all' && e.classId !== classFilter) return false;
      if (typeFilter !== 'all' && e.scheduleType !== typeFilter) return false;
      return true;
    });
  }, [allEvents, classFilter, typeFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const todayLessons = useMemo(
    () => buildTodayLessons(allEvents, students, logs, followups, today),
    [allEvents, students, logs, followups, today]
  );

  const detailPrep = selected
    ? getClassPrepData(selected.classId, students, logs, followups)
    : null;

  const detailAttention = selected
    ? getAttentionStudents(
        students.filter((s) => s.class_id === selected.classId),
        new Map(
          students
            .filter((s) => s.class_id === selected.classId)
            .map((s) => [s.id, logs.filter((l) => l.student_id === s.id)])
        )
      )
    : [];

  const shiftWeek = (delta: number) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">시간표</h1>
        <p className="text-sm text-slate-500 mt-1">
          오늘 수업과 수업 전 확인 — 일정은 수업 준비 도구입니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="px-3 py-2 rounded-lg border text-sm cursor-pointer"
        >
          ← 이전 주
        </button>
        <button
          type="button"
          onClick={() => setWeekAnchor(new Date())}
          className="px-3 py-2 rounded-lg border text-sm cursor-pointer"
        >
          이번 주
        </button>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="px-3 py-2 rounded-lg border text-sm cursor-pointer"
        >
          다음 주 →
        </button>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm ml-auto"
        >
          <option value="all">전체 반</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <Link href="/settings" className="text-xs text-indigo-600 hover:underline">
          일정 등록 → 설정
        </Link>
      </div>

      <section className="rounded-2xl p-5 bg-indigo-50 border border-indigo-100">
        <h2 className="text-sm font-bold text-indigo-950 mb-3">오늘 수업</h2>
        {todayLessons.length === 0 ? (
          <p className="text-sm text-indigo-700/80">오늘 등록된 수업 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {todayLessons.map((item) => (
              <div key={item.event.id} onClick={() => setSelected(item.event)}>
                <LessonFlowCard item={item} date={today} compact />
              </div>
            ))}
          </ul>
        )}
      </section>

      <ScheduleTypeLegend className="px-1" />

      <div className="grid lg:grid-cols-3 gap-5 min-w-0">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden min-w-0">
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-semibold text-slate-500">
            {weekDates.map((d) => {
              const dt = new Date(d + 'T12:00:00');
              return (
                <div key={d} className={cn('py-2', d === today && 'bg-indigo-50 text-indigo-700')}>
                  {dayLabel(dt.getDay())}
                  <div className="font-normal text-[10px]">{d.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[280px]">
            {weekDates.map((d) => (
              <div
                key={d}
                className={cn(
                  'border-r border-slate-50 p-1 space-y-1 last:border-r-0',
                  d === today && 'bg-indigo-50/30'
                )}
              >
                {filtered
                  .filter((e) => e.date === d)
                  .map((ev) => (
                    <ScheduleEventChip
                      key={ev.id}
                      event={ev}
                      selected={selected?.id === ev.id}
                      onSelect={() => setSelected(ev)}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 min-w-0">
          <h3 className="text-sm font-bold mb-3">수업 상세</h3>
          {!selected ? (
            <p className="text-sm text-slate-400">캘린더에서 수업을 선택하세요.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-slate-900">{selected.className}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {selected.date} · {formatTimeRange(selected.startTime, selected.endTime)}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit',
                    SCHEDULE_TYPE_STYLES[selected.scheduleType as ScheduleType].chip
                  )}
                >
                  {SCHEDULE_TYPE_LABELS[selected.scheduleType as ScheduleType]}
                </p>
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                  <i className="ri-map-pin-line text-slate-400" />
                  {scheduleLocationLabel(selected.location)}
                </p>
                {selected.teacherName && (
                  <p className="text-xs text-slate-500">담당: {selected.teacherName}</p>
                )}
              </div>
              <p className="text-xs text-slate-600">
                학생 {students.filter((s) => s.class_id === selected.classId).length}명
                {!logsLoading &&
                  ` · 관리 필요 ${detailAttention.length}명`}
              </p>
              {selected && (() => {
                const tl =
                  todayLessons.find((t) => t.event.id === selected.id) ??
                  ({
                    event: selected,
                    studentCount: students.filter((s) => s.class_id === selected.classId).length,
                    attentionCount: detailAttention.length,
                    followupCount: followups.filter((f) =>
                      students.some(
                        (s) => s.class_id === selected.classId && s.id === f.student_id
                      )
                    ).length,
                    hasLogToday: logs.some(
                      (l) => l.class_id === selected.classId && l.lesson_date === today
                    ),
                  } as import('@/types/database').TodayLessonItem);
                return <FlowBadgeRow badges={getLessonFlowState(tl, today).badges} />;
              })()}
              {detailAttention.length > 0 && (
                <ul className="text-xs space-y-1 text-amber-800 bg-amber-50 rounded-lg p-3">
                  {detailAttention.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      {a.name}: {a.reason}
                    </li>
                  ))}
                </ul>
              )}
              {detailPrep?.recentUnit && (
                <p className="text-xs">
                  <span className="font-medium">최근 단원:</span> {detailPrep.recentUnit}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Link
                  href={`/lesson-logs?class=${selected.classId}`}
                  className="text-center text-xs py-2 rounded-lg border cursor-pointer"
                >
                  수업 기록 입력
                </Link>
                <Link
                  href={`/schedule/prep?classId=${selected.classId}&date=${selected.date}`}
                  className="text-center text-xs py-2 rounded-lg bg-indigo-600 text-white cursor-pointer"
                >
                  수업 준비
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {schedules.length === 0 && (
        <EmptyState
          title="반별 일정이 없습니다"
          description="설정 → 반별 수업 일정에서 매주 수업 시간을 등록해 주세요."
        />
      )}
    </div>
  );
}
