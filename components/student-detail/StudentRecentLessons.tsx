'use client';

import type { LessonLog } from '@/types/database';
import { ATTENDANCE_LABELS, HOMEWORK_LABELS } from '@/lib/statusLabels';
import { cn } from '@/lib/cn';

export function StudentLessonDrawer({
  log,
  hasAiSummary,
  onClose,
}: {
  log: LessonLog | null;
  hasAiSummary: boolean;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <>
      <button
        type="button"
        aria-label="닫기"
        className="fixed inset-0 z-40 bg-slate-900/40"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col"
        style={{ background: 'var(--app-surface)', boxShadow: 'var(--s-lg)' }}
      >
        <header
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--app-ink-4)' }}>
              수업 상세
            </p>
            <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>
              {log.lesson_date}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--app-surface-2)]">
            <i className="ri-close-line text-xl" style={{ color: 'var(--app-ink-3)' }} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--app-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
                출결
              </p>
              <p className="text-sm font-semibold mt-1">{ATTENDANCE_LABELS[log.attendance_status]}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--app-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
                숙제
              </p>
              <p className="text-sm font-semibold mt-1">{HOMEWORK_LABELS[log.homework_status]}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--app-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
                점수
              </p>
              <p className="text-sm font-semibold mt-1 tabular-nums">
                {log.test_score != null ? `${log.test_score}점` : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--app-surface-2)' }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
                AI 요약
              </p>
              <p className="text-sm font-semibold mt-1">{hasAiSummary ? '있음' : '—'}</p>
            </div>
          </div>
          {log.unit && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-3)' }}>
                단원
              </p>
              <p className="text-sm" style={{ color: 'var(--app-ink)' }}>
                {log.unit}
              </p>
            </div>
          )}
          {log.memo?.trim() && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-3)' }}>
                메모
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                {log.memo}
              </p>
            </div>
          )}
          {log.tags && log.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {log.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent-text)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function StudentRecentLessons({
  logs,
  cardPeriods,
  onSelect,
}: {
  logs: LessonLog[];
  cardPeriods: Set<string>;
  onSelect: (log: LessonLog) => void;
}) {
  if (logs.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--app-ink-3)' }}>
        수업 기록이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {logs.map((log) => {
        const isAbsent = log.attendance_status === 'absent';
        const hasAi = cardPeriods.has(log.lesson_date.slice(0, 7));
        return (
          <li key={log.id}>
            <button
              type="button"
              onClick={() => onSelect(log)}
              className={cn(
                'w-full text-left rounded-xl px-4 py-3.5 transition-colors hover:shadow-sm',
                'flex flex-wrap items-center justify-between gap-3',
                isAbsent && 'app-card-danger'
              )}
              style={
                isAbsent
                  ? undefined
                  : { background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }
              }
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {log.lesson_date}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>
                  {log.unit || '단원 미입력'}
                  {log.memo ? ` · ${log.memo.slice(0, 40)}${log.memo.length > 40 ? '…' : ''}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--app-surface)', color: 'var(--app-ink-2)' }}>
                  {ATTENDANCE_LABELS[log.attendance_status]}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--app-surface)', color: 'var(--app-ink-2)' }}>
                  {HOMEWORK_LABELS[log.homework_status]}
                </span>
                {log.test_score != null && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums" style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent-text)' }}>
                    {log.test_score}점
                  </span>
                )}
                {hasAi && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full app-badge-violet">
                    AI
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
