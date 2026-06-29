'use client';

import Link from 'next/link';
import { getLessonFlowState } from '@/lib/learningFlow';
import { formatTimeRange } from '@/lib/scheduleLabels';
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
            const state = getLessonFlowState(item, today);
            const isActive = state.timing === 'in_progress';
            const isDone = item.hasLogToday && !isActive;

            return (
              <li key={item.event.id}>
                <div
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4',
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
                      <p className="text-base font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                        {item.event.className}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                        {formatTimeRange(item.event.startTime, item.event.endTime)}
                        {item.event.teacherName && ` · ${item.event.teacherName}`}
                        {item.studentCount > 0 && ` · ${item.studentCount}명`}
                        {isActive && (
                          <span className="ml-1.5 font-medium" style={{ color: 'var(--app-accent)' }}>
                            · 진행 중
                          </span>
                        )}
                        {isDone && (
                          <span className="ml-1.5" style={{ color: 'var(--app-ink-4)' }}>
                            · 기록 완료
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="sm:shrink-0 pl-[4.5rem] sm:pl-0">
                    <Link
                      href={action.href}
                      className={cn(
                        'app-btn text-sm whitespace-nowrap',
                        action.label === '수업하기' ? 'app-btn-primary' : 'app-btn-secondary'
                      )}
                    >
                      {action.label}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
