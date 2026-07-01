'use client';

import { cn } from '@/lib/cn';
import { formatSavedAt } from '@/lib/formatSavedAt';
import type { LessonFormRow } from '@/lib/lessonLogRowDefaults';
import type { AttendanceStatus, HomeworkStatus, Student } from '@/types/database';

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
};

const HOMEWORK_LABEL: Record<HomeworkStatus, string> = {
  complete: '완료',
  partial: '부분',
  missing: '미제출',
};

type Option<T extends string> = { value: T; label: string };

function PillToggle<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  disabled?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'text-[11px] font-medium px-2 py-1 rounded-md border transition-colors disabled:opacity-50',
              active
                ? 'bg-[var(--app-accent)] text-white border-transparent'
                : 'bg-[var(--app-surface-2)] text-[var(--app-ink-3)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type StudentRecordingCardProps = {
  student: Student;
  row: LessonFormRow;
  disabled?: boolean;
  saving?: boolean;
  savedAt?: number | null;
  inputStyle: React.CSSProperties;
  attendanceOptions: Option<AttendanceStatus>[];
  homeworkOptions: Option<HomeworkStatus>[];
  onUpdate: <K extends keyof LessonFormRow>(field: K, value: LessonFormRow[K]) => void;
};

export function StudentRecordingCard({
  student,
  row,
  disabled,
  saving,
  savedAt,
  inputStyle,
  attendanceOptions,
  homeworkOptions,
  onUpdate,
}: StudentRecordingCardProps) {
  const isAbsent = row.attendance === 'absent';

  return (
    <article
      className={cn('rounded-xl p-3 space-y-2.5', isAbsent && 'app-card-danger')}
      style={
        isAbsent
          ? undefined
          : { background: 'var(--app-surface)', border: '1px solid var(--app-border)' }
      }
    >
      <header className="flex items-center justify-between gap-2 min-h-[1.25rem]">
        <p
          className={cn('text-sm font-semibold truncate', isAbsent && 'app-card-danger-title')}
          style={isAbsent ? undefined : { color: 'var(--app-ink)' }}
        >
          {student.name}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {saving ? (
            <span className="text-[10px] animate-pulse" style={{ color: 'var(--app-ink-4)' }}>
              저장…
            </span>
          ) : formatSavedAt(savedAt) ? (
            <span className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>
              저장됨 · {formatSavedAt(savedAt)}
            </span>
          ) : null}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--app-surface-2)',
              color: 'var(--app-ink-4)',
            }}
          >
            {ATTENDANCE_LABEL[row.attendance]} · {HOMEWORK_LABEL[row.homework]}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
            출결
          </span>
          <PillToggle
            options={attendanceOptions}
            value={row.attendance}
            disabled={disabled}
            onChange={(v) => onUpdate('attendance', v)}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
            숙제
          </span>
          <PillToggle
            options={homeworkOptions}
            value={row.homework}
            disabled={disabled}
            onChange={(v) => onUpdate('homework', v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="shrink-0 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide block" style={{ color: 'var(--app-ink-4)' }}>
            점수
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              disabled={disabled}
              value={row.score}
              onChange={(e) => onUpdate('score', e.target.value)}
              className="w-14 px-2 py-1.5 rounded-lg text-sm text-center tabular-nums"
              style={inputStyle}
              placeholder="—"
              aria-label={`${student.name} 점수`}
            />
            <span className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>
              점
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide block" style={{ color: 'var(--app-ink-4)' }}>
            메모
          </span>
          <input
            type="text"
            disabled={disabled}
            value={row.note}
            onChange={(e) => onUpdate('note', e.target.value)}
            placeholder="메모 (선택)"
            className="w-full px-2 py-1.5 rounded-lg text-sm"
            style={inputStyle}
            aria-label={`${student.name} 메모`}
          />
        </div>
      </div>
    </article>
  );
}
