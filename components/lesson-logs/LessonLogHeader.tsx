'use client';

import type { ClassRow } from '@/types/database';
import { formatLessonTime, lessonInputStyle } from '@/components/lesson-logs/lessonLogConstants';

type Props = {
  classes: ClassRow[];
  selectedClassId: string;
  onClassChange: (id: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  className?: string;
  studentCount: number;
  teacherName?: string;
  lessonLoading: boolean;
  statusStyle: { bg: string; text: string; border: string; label: string } | null;
  lessonScheduled: boolean;
  lessonClosed: boolean;
  hasLesson: boolean;
  starting: boolean;
  onStartLesson: () => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  onLoadProgress: () => void;
  startedAt?: string | null;
};

export function LessonLogHeader({
  classes,
  selectedClassId,
  onClassChange,
  date,
  onDateChange,
  className,
  studentCount,
  teacherName,
  lessonLoading,
  statusStyle,
  lessonScheduled,
  lessonClosed,
  hasLesson,
  starting,
  onStartLesson,
  unit,
  onUnitChange,
  onLoadProgress,
  startedAt,
}: Props) {
  const inputStyle = lessonInputStyle(false);
  const unitStyle = lessonInputStyle(lessonClosed);

  return (
    <header
      className="rounded-2xl px-6 py-6"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--app-ink-4)' }}
      >
        오늘 수업
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={selectedClassId}
          onChange={(e) => onClassChange(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm min-h-[40px] flex-1 min-w-[140px]"
          style={inputStyle}
          aria-label="반 선택"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.grade})
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={inputStyle}
          aria-label="날짜"
        />
      </div>

      {selectedClassId && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
              >
                {className ?? '반'}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--app-ink-3)' }}>
                <span className="tabular-nums">{date}</span>
                <span>학생 {studentCount}명</span>
                <span>시작 {formatLessonTime(startedAt)}</span>
                <span>강사 {teacherName ?? '—'}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {lessonLoading ? (
                <span className="text-xs" style={{ color: 'var(--app-ink-4)' }}>불러오는 중…</span>
              ) : statusStyle ? (
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    borderColor: statusStyle.border,
                  }}
                >
                  {statusStyle.label}
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--app-ink-4)' }}>수업 없음</span>
              )}

              {(!hasLesson || lessonScheduled) && !lessonClosed && (
                <button
                  type="button"
                  disabled={starting}
                  onClick={onStartLesson}
                  className="app-btn app-btn-primary disabled:opacity-50"
                >
                  {starting ? '시작 중…' : '수업 시작'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--app-border)' }}>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-1.5">
              <label className="app-label">오늘 단원</label>
              {!lessonClosed && (
                <button type="button" onClick={onLoadProgress} className="app-btn app-btn-ghost app-btn-sm">
                  진도 불러오기
                </button>
              )}
            </div>
            <input
              type="text"
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              disabled={lessonClosed}
              placeholder="예: 삼각함수 3단원"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={unitStyle}
            />
          </div>
        </>
      )}
    </header>
  );
}
