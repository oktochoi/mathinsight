'use client';

import Link from 'next/link';
import { getLessonFlowState } from '@/lib/learningFlow';
import type { DashboardStats, TodayLessonItem } from '@/types/database';
import { cn } from '@/lib/cn';

function sortLessons(lessons: TodayLessonItem[]) {
  return [...lessons].sort((a, b) => a.event.startTime.localeCompare(b.event.startTime));
}

function lessonAction(
  item: TodayLessonItem,
  today: string
): { label: string; href: string } {
  const href = `/lesson-logs?class=${item.event.classId}&date=${today}`;
  const state = getLessonFlowState(item, today);
  if (state.timing === 'canceled') return { label: '휴강', href };
  if (item.hasLogToday && state.timing !== 'in_progress') return { label: '기록 보기', href };
  return { label: '수업하기', href };
}

function statusBadge(item: TodayLessonItem, today: string) {
  const state = getLessonFlowState(item, today);
  const isActive = state.timing === 'in_progress';
  const isDone = item.hasLogToday && !isActive;
  const isCanceled = state.timing === 'canceled';

  if (isCanceled) {
    return { icon: 'ri-close-circle-line', label: '휴강', tone: 'muted' as const };
  }
  if (isActive) {
    return { icon: 'ri-play-circle-fill', label: '진행 중', tone: 'active' as const };
  }
  if (isDone) {
    return { icon: 'ri-checkbox-circle-fill', label: '완료', tone: 'done' as const };
  }
  return { icon: 'ri-time-line', label: '예정', tone: 'scheduled' as const };
}

export function TodayLessonsPanel({ stats }: { stats: DashboardStats }) {
  const today = new Date().toISOString().slice(0, 10);
  const lessons = sortLessons(stats.todayLessons);

  return (
    <section
      id="today-lessons"
      className="rounded-2xl overflow-hidden scroll-mt-20"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-xs)',
      }}
    >
      <header className="px-5 py-4 border-b" style={{ borderColor: 'var(--app-border)' }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            오늘 수업
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            오늘 {lessons.length}개 수업
          </p>
        </div>
      </header>

      {lessons.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
            오늘 등록된 수업이 없습니다.
          </p>
          <Link href="/lesson-logs" className="inline-flex app-btn app-btn-primary text-sm mt-4">
            수업 기록 입력
          </Link>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
          {lessons.map((item) => {
            const action = lessonAction(item, today);
            const badge = statusBadge(item, today);
            const isActive = badge.tone === 'active';

            return (
              <li key={item.event.id}>
                <Link
                  href={action.href}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--app-surface-2)]',
                    isActive && 'bg-[var(--app-accent-bg)]/40'
                  )}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="text-center shrink-0 w-14">
                      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--app-ink)' }}>
                        {item.event.startTime.slice(0, 5)}
                      </p>
                      <p className="text-[10px] tabular-nums" style={{ color: 'var(--app-ink-4)' }}>
                        {item.event.endTime.slice(0, 5)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                          {item.event.className}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            badge.tone === 'active' && 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            badge.tone === 'done' && 'bg-slate-100 text-slate-700 border-slate-200',
                            badge.tone === 'scheduled' && 'bg-amber-50 text-amber-900 border-amber-200',
                            badge.tone === 'muted' && 'bg-slate-50 text-slate-500 border-slate-200'
                          )}
                        >
                          {isActive && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                          )}
                          <i className={badge.icon} aria-hidden />
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                        {item.event.teacherName && `${item.event.teacherName}`}
                        {item.studentCount > 0 && `${item.event.teacherName ? ' · ' : ''}${item.studentCount}명`}
                      </p>
                    </div>
                  </div>

                  <div className="sm:shrink-0 pl-[4.5rem] sm:pl-0">
                    <span
                      className={cn(
                        'inline-flex app-btn text-sm whitespace-nowrap pointer-events-none',
                        action.label === '수업하기' ? 'app-btn-primary' : 'app-btn-secondary'
                      )}
                    >
                      {action.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
