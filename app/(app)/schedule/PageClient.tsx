'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useClassSchedules } from '@/hooks/useClassSchedules';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useIntakeConsultations } from '@/hooks/useIntakeConsultations';
import { useClasses } from '@/hooks/useClasses';
import { expandCalendarEvents, getWeekDates, dayLabel } from '@/lib/schedules';
import {
  buildCalendarTimeSlots,
  intakeToCalendarEvents,
  type CalendarTimeSlot,
} from '@/lib/growthPipeline';
import { ScheduleCalendarSlot } from '@/components/schedules/ScheduleCalendarSlot';
import { SlotItemPicker } from '@/components/schedules/SlotItemPicker';
import { buildTodayLessons, getClassPrepData } from '@/lib/classInsights';
import { getLessonFlowState } from '@/lib/learningFlow';
import { FlowBadgeRow } from '@/components/flow/FlowBadgeRow';
import { getAttentionStudents } from '@/lib/analytics';
import {
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_STYLES,
  formatTimeRange,
  scheduleLocationLabel,
} from '@/lib/scheduleLabels';
import { ClassSchedulesSection } from '@/components/schedules/ClassSchedulesSection';
import type { CalendarLessonEvent, ScheduleType } from '@/types/database';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

/* ─── Time Grid Constants ─── */
const HOUR_HEIGHT = 72; // px per hour
const START_HOUR  = 9;
const END_HOUR    = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function eventTop(startTime: string): number {
  const startMin = timeToMinutes(startTime);
  return ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function eventHeight(startTime: string, endTime: string): number {
  const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Math.max((mins / 60) * HOUR_HEIGHT, 28);
}

function nowPosition(): number | null {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (totalMin < START_HOUR * 60 || totalMin > END_HOUR * 60) return null;
  return ((totalMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

/* ─── Type color map ─── */
const TYPE_COLORS: Record<ScheduleType, { bg: string; border: string; text: string }> = {
  regular:  { bg: 'var(--event-regular-bg)', border: 'var(--event-regular-border)', text: 'var(--event-regular-text)' },
  makeup:   { bg: 'var(--event-makeup-bg)', border: 'var(--event-makeup-border)', text: 'var(--event-makeup-text)' },
  special:  { bg: 'var(--event-special-bg)', border: 'var(--event-special-border)', text: 'var(--event-special-text)' },
  canceled: { bg: 'var(--event-canceled-bg)', border: 'var(--event-canceled-border)', text: 'var(--event-canceled-text)' },
};

/* ─── Day header format ─── */
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function SchedulePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SchedulePageContent />
    </Suspense>
  );
}

function SchedulePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') === 'manage' ? 'manage' : 'calendar';
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [classFilter, setClassFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState<CalendarTimeSlot | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [nowY, setNowY] = useState<number | null>(null);

  const selectSlot = (slot: CalendarTimeSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setSelectedItemIndex(null);
      return;
    }
    setSelectedSlot(slot);
    setSelectedItemIndex(slot.items.length === 1 ? 0 : null);
  };

  const selectedItem =
    selectedSlot && selectedItemIndex != null ? selectedSlot.items[selectedItemIndex] : null;
  const selectedLesson =
    selectedItem?.kind === 'lesson' ? selectedItem.event : null;
  const selectedIntakes =
    selectedItem?.kind === 'intake' ? [selectedItem.event] : [];

  const { schedules, exceptions, loading } = useClassSchedules();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { logs, loading: logsLoading } = useLessonLogs({ limit: 500 });
  const { followups } = useConsultationFollowups();
  const { intakes } = useIntakeConsultations();

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const allEvents = useMemo(
    () => expandCalendarEvents(schedules, exceptions, weekDates),
    [schedules, exceptions, weekDates]
  );

  const filtered = useMemo(() => {
    if (classFilter === 'all') return allEvents;
    return allEvents.filter((e) => e.classId === classFilter);
  }, [allEvents, classFilter]);

  const intakeEvents = useMemo(
    () => intakeToCalendarEvents(intakes, weekDates),
    [intakes, weekDates]
  );

  const calendarSlots = useMemo(
    () => buildCalendarTimeSlots(filtered, intakeEvents),
    [filtered, intakeEvents]
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayLessons = useMemo(
    () => buildTodayLessons(allEvents, students, logs, followups, today),
    [allEvents, students, logs, followups, today]
  );

  const detailPrep = selectedLesson
    ? getClassPrepData(selectedLesson.classId, students, logs, followups)
    : null;

  const detailAttention = selectedLesson
    ? getAttentionStudents(
        students.filter((s) => s.class_id === selectedLesson.classId),
        new Map(
          students
            .filter((s) => s.class_id === selectedLesson.classId)
            .map((s) => [s.id, logs.filter((l) => l.student_id === s.id)])
        )
      )
    : [];

  const prepClassId = searchParams.get('classId');
  const prepDate = searchParams.get('date');

  /* Current time line update */
  useEffect(() => {
    const update = () => setNowY(nowPosition());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  /* /schedule/prep 딥링크 → 해당 수업 선택 */
  useEffect(() => {
    if (!prepClassId || tab !== 'calendar' || calendarSlots.length === 0) return;
    const targetDate = prepDate ?? today;
    if (prepDate) {
      setWeekAnchor(new Date(`${targetDate}T12:00:00`));
    }
    for (const slot of calendarSlots) {
      const idx = slot.items.findIndex(
        (item) =>
          item.kind === 'lesson' &&
          item.event.classId === prepClassId &&
          item.event.date === targetDate
      );
      if (idx >= 0) {
        setSelectedSlot(slot);
        setSelectedItemIndex(idx);
        break;
      }
    }
  }, [prepClassId, prepDate, tab, calendarSlots, today]);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const isCurrentWeek = useMemo(() => {
    const todayAnchor = new Date();
    return getWeekDates(todayAnchor)[0] === weekDates[0];
  }, [weekDates]);

  if (loading) return <PageLoader />;

  /* ─── Week label ─── */
  const weekLabel = (() => {
    const s = new Date(weekDates[0] + 'T12:00:00');
    const e = new Date(weekDates[6] + 'T12:00:00');
    const sFmt = s.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const eFmt = e.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `${s.getFullYear()}년 ${sFmt} – ${eFmt}`;
  })();

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
          >
            시간표
          </h1>
        </div>
      </div>

      {/* Tab nav */}
      <div
        className="flex gap-0.5 p-1 rounded-xl w-fit"
        style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
      >
        {(
          [
            ['calendar', '주간 시간표', '/schedule'],
            ['manage',   '일정 등록',   '/schedule?tab=manage'],
          ] as const
        ).map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === key
                ? 'text-[var(--app-ink)] shadow-sm'
                : 'text-[var(--app-ink-3)] hover:text-[var(--app-ink-2)]'
            )}
            style={
              tab === key
                ? { background: 'var(--app-surface)', boxShadow: 'var(--s-xs)' }
                : {}
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === 'manage' ? (
        <ClassSchedulesSection />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 min-w-0">
          {/* ─── Calendar panel ─── */}
          <div
            className="rounded-2xl overflow-hidden min-w-0"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-sm)',
            }}
          >
            {/* Calendar toolbar */}
            <div
              className="flex flex-wrap items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              {/* Week navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftWeek(-1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  style={{
                    border: '1px solid var(--app-border-md)',
                    background: 'var(--app-surface)',
                    color: 'var(--app-ink-2)',
                  }}
                >
                  <i className="ri-arrow-left-s-line text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftWeek(1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  style={{
                    border: '1px solid var(--app-border-md)',
                    background: 'var(--app-surface)',
                    color: 'var(--app-ink-2)',
                  }}
                >
                  <i className="ri-arrow-right-s-line text-base" />
                </button>
              </div>

              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--app-ink)', letterSpacing: '-0.01em' }}
              >
                {weekLabel}
              </span>

              {!isCurrentWeek && (
                <button
                  type="button"
                  onClick={() => setWeekAnchor(new Date())}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer app-border-accent"
                  style={{
                    background: 'var(--app-accent-bg)',
                    color: 'var(--app-accent-text)',
                  }}
                >
                  이번 주
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href="/counseling?step=intake"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors app-inline-info"
                >
                  신입 상담
                </Link>
                {/* Class filter */}
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  style={{
                    border: '1px solid var(--app-border-md)',
                    background: 'var(--app-surface)',
                    color: 'var(--app-ink-2)',
                  }}
                >
                  <option value="all">전체 반</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Day header row */}
            <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              <div />
              {weekDates.map((d) => {
                const dt    = new Date(d + 'T12:00:00');
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    className="py-2 text-center"
                    style={{ borderLeft: '1px solid var(--app-border)' }}
                  >
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: isToday ? 'var(--app-accent)' : 'var(--app-ink-3)' }}
                    >
                      {DAY_NAMES[dt.getDay()]}
                    </p>
                    <div
                      className={cn(
                        'text-sm font-bold mx-auto mt-0.5 w-7 h-7 rounded-full flex items-center justify-center',
                        isToday ? 'text-white' : ''
                      )}
                      style={isToday ? { background: 'var(--app-accent)', color: 'var(--app-on-accent)' } : { color: 'var(--app-ink)' }}
                    >
                      {dt.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              className="relative overflow-auto"
              style={{ borderTop: '1px solid var(--app-border)', maxHeight: '62vh' }}
            >
              <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)', height: GRID_HEIGHT }}>

                {/* Time labels column */}
                <div className="relative">
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div
                      key={i}
                      className="absolute right-2 app-time-label"
                      style={{ top: i * HOUR_HEIGHT - 7 }}
                    >
                      {String(START_HOUR + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((d) => {
                  const isToday = d === today;
                  const daySlots = calendarSlots.filter((s) => s.date === d);
                  return (
                    <div
                      key={d}
                      className="relative"
                      style={{
                        borderLeft: '1px solid var(--app-border)',
                        background: isToday ? 'var(--app-accent-muted-bg)' : 'transparent',
                      }}
                    >
                      {/* Hour grid lines */}
                      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 pointer-events-none"
                          style={{
                            top: i * HOUR_HEIGHT,
                            borderTop: `1px solid ${i === 0 ? 'transparent' : 'var(--app-border)'}`,
                            height: HOUR_HEIGHT,
                          }}
                        />
                      ))}

                      {/* Current time indicator */}
                      {isToday && nowY !== null && (
                        <div
                          className="app-cal-now-line"
                          style={{ top: nowY }}
                        >
                          <div className="app-cal-now-dot" />
                        </div>
                      )}

                      {/* Time slots (lessons + intake consultations) */}
                      {daySlots.map((slot) => {
                        const top = eventTop(slot.startTime);
                        const height = eventHeight(slot.startTime, slot.endTime);
                        const isSel = selectedSlot?.id === slot.id;
                        return (
                          <ScheduleCalendarSlot
                            key={slot.id}
                            slot={slot}
                            top={top}
                            height={height}
                            selected={isSel}
                            onSelect={() => selectSlot(slot)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Type legend */}
            <div
              className="flex flex-wrap gap-3 px-4 py-2.5"
              style={{ borderTop: '1px solid var(--app-border)' }}
            >
              {(Object.entries(TYPE_COLORS) as [ScheduleType, typeof TYPE_COLORS.regular][]).map(
                ([type, c]) => (
                  <span key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--app-ink-3)' }}>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: c.border }}
                    />
                    {SCHEDULE_TYPE_LABELS[type]}
                  </span>
                )
              )}
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--app-ink-3)' }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--app-info)' }} />
                신입 상담
              </span>
            </div>
          </div>

          {/* ─── Detail panel ─── */}
          <div className="flex flex-col gap-4">
            {/* Selected event detail */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                boxShadow: 'var(--s-sm)',
              }}
            >
              {!selectedSlot ? (
                <div className="app-empty py-8">
                  <div className="app-empty-icon">
                    <i className="ri-calendar-line" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                    캘린더에서 수업·상담을 선택하세요
                  </p>
                </div>
              ) : selectedItemIndex == null && selectedSlot.items.length > 1 ? (
                <SlotItemPicker
                  slot={selectedSlot}
                  onSelect={(index) => setSelectedItemIndex(index)}
                  onCancel={() => {
                    setSelectedSlot(null);
                    setSelectedItemIndex(null);
                  }}
                />
              ) : (
                <div className="space-y-4 app-fade-in">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-base font-bold"
                        style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}
                      >
                        {selectedLesson?.className ?? selectedIntakes[0]?.prospectName ?? '일정'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlot(null);
                          setSelectedItemIndex(null);
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ color: 'var(--app-ink-3)' }}
                      >
                        <i className="ri-close-line text-sm" />
                      </button>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
                      {selectedSlot.date} · {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedSlot.lessonCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800">
                          수업 {selectedSlot.lessonCount}
                        </span>
                      )}
                      {selectedSlot.intakeCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-900">
                          신입 상담 {selectedSlot.intakeCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedIntakes.length > 0 && (
                    <div className="rounded-xl p-3 space-y-2 app-card-info">
                      <p className="text-[10px] font-semibold app-text-info">신입 상담</p>
                      <ul className="space-y-2">
                        {selectedIntakes.map((intake) => (
                          <li key={intake.id} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                                {intake.prospectName}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                                {intake.grade}
                              </p>
                            </div>
                            <Link
                              href={`/counseling?step=intake`}
                              className="text-xs font-semibold text-cyan-800 shrink-0"
                            >
                              기록 →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedLesson && (
                    <>
                      <div
                        className="rounded-xl p-3 space-y-1.5"
                        style={{ background: 'var(--app-surface-2)' }}
                      >
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--app-ink-2)' }}>
                          <i className="ri-map-pin-line text-sm shrink-0" style={{ color: 'var(--app-ink-3)' }} />
                          {scheduleLocationLabel(selectedLesson.location)}
                        </div>
                        {selectedLesson.teacherName && (
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--app-ink-2)' }}>
                            <i className="ri-user-line text-sm shrink-0" style={{ color: 'var(--app-ink-3)' }} />
                            {selectedLesson.teacherName}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--app-ink-2)' }}>
                          <i className="ri-group-line text-sm shrink-0" style={{ color: 'var(--app-ink-3)' }} />
                          학생 {students.filter((s) => s.class_id === selectedLesson.classId).length}명
                          {!logsLoading && detailAttention.length > 0 && ` · 확인 권장 ${detailAttention.length}명`}
                        </div>
                      </div>

                      {(() => {
                        const tl =
                          todayLessons.find((t) => t.event.id === selectedLesson.id) ??
                          ({
                            event: selectedLesson,
                            studentCount: students.filter((s) => s.class_id === selectedLesson.classId).length,
                            attentionCount: detailAttention.length,
                            followupCount: followups.filter((f) =>
                              students.some((s) => s.class_id === selectedLesson.classId && s.id === f.student_id)
                            ).length,
                            hasLogToday: logs.some(
                              (l) => l.class_id === selectedLesson.classId && l.lesson_date === today
                            ),
                          } as import('@/types/database').TodayLessonItem);
                        return <FlowBadgeRow badges={getLessonFlowState(tl, today).badges} />;
                      })()}

                      {detailAttention.length > 0 && (
                        <div className="rounded-xl p-3 app-card-warning">
                          <p className="text-[10px] font-semibold mb-2 app-card-warning-title">
                            이번 수업 확인
                          </p>
                          <ul className="space-y-1">
                            {detailAttention.slice(0, 4).map((a) => (
                              <li key={a.id} className="text-xs flex gap-1.5 app-card-warning-body">
                                <span className="shrink-0">·</span>
                                <span>{a.name}: {a.reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {detailPrep?.recentUnit && (
                        <p className="text-xs" style={{ color: 'var(--app-ink-2)' }}>
                          <span className="font-medium" style={{ color: 'var(--app-ink)' }}>최근 단원:</span>{' '}
                          {detailPrep.recentUnit}
                        </p>
                      )}

                      <Link
                        href={`/lesson-logs?class=${selectedLesson.classId}&date=${selectedLesson.date}`}
                        className="app-btn app-btn-primary w-full justify-center text-sm"
                      >
                        <i className="ri-edit-line" />
                        수업 기록 입력
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Today's lessons quick list */}
            {todayLessons.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  boxShadow: 'var(--s-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: 'var(--app-ink)', letterSpacing: '-0.01em' }}
                  >
                    오늘 수업
                  </h3>
                  <span className="app-badge app-badge-blue text-[10px]">
                    {todayLessons.length}개
                  </span>
                </div>
                <ul className="space-y-2">
                  {todayLessons.map((item) => {
                    const state = getLessonFlowState(item, today);
                    const isActive = state.timing === 'in_progress';
                    return (
                      <li key={item.event.id}>
                        <button
                          type="button"
                          onClick={() => {
                            const slot = calendarSlots.find(
                              (s) =>
                                s.date === item.event.date &&
                                s.items.some(
                                  (i) => i.kind === 'lesson' && i.event.id === item.event.id
                                )
                            );
                            if (slot) selectSlot(slot);
                            else {
                              setSelectedSlot(null);
                              setSelectedItemIndex(null);
                            }
                          }}
                          className="w-full text-left rounded-xl px-3 py-2.5 transition-all cursor-pointer"
                          style={{
                            background: isActive ? 'var(--app-accent-bg)' : 'var(--app-surface-2)',
                            border: `1px solid ${isActive ? 'var(--app-accent-border)' : 'var(--app-border)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold" style={{ color: 'var(--app-ink)' }}>
                              {item.event.className}
                            </p>
                            {isActive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}>
                                진행 중
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                            {formatTimeRange(item.event.startTime, item.event.endTime)} · {item.studentCount}명
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'calendar' && schedules.length === 0 && (
        <EmptyState
          title="등록된 일정이 없습니다"
          description="일정 등록 탭에서 반별 수업 시간을 추가하세요."
        />
      )}
    </div>
  );
}
