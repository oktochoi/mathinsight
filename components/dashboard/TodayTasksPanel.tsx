'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';

type TaskRow = {
  id: string;
  label: string;
  count: number;
  href: string;
  done: boolean;
  detail?: string;
};

function buildTodayTasks(stats: DashboardStats): TaskRow[] {
  const retentionCount =
    stats.retentionHighRiskCount > 0
      ? stats.retentionHighRiskCount
      : stats.retentionRiskStudents.length;

  const tasks: TaskRow[] = [
    {
      id: 'unclosed',
      label: '수업 마감 안 된 건',
      count: stats.unclosedLessonsToday.length,
      href: '/lesson-logs',
      done: stats.unclosedLessonsToday.length === 0,
      detail: stats.unclosedLessonsToday.length > 0 ? '마감 후 다음 업무 진행' : undefined,
    },
    {
      id: 'attendance',
      label: '출결 입력 필요',
      count: stats.pendingAttendanceInputCount,
      href: '/lesson-logs',
      done: stats.pendingAttendanceInputCount === 0,
    },
    {
      id: 'counseling',
      label: '상담 준비 필요한 학생',
      count: stats.todayCounselingQueue.length + stats.pendingConsultationCount,
      href: '/counseling?step=prep',
      done: stats.todayCounselingQueue.length === 0 && stats.pendingConsultationCount === 0,
    },
    {
      id: 'billing',
      label: '미납 확인 필요한 학생',
      count: stats.overduePaymentsCount,
      href: '/billing',
      done: stats.overduePaymentsCount === 0,
    },
    {
      id: 'parent',
      label: '학부모 전달 대기',
      count: stats.pendingParentMessagesCount,
      href: '/parent-hub?tab=messages',
      done: stats.pendingParentMessagesCount === 0,
    },
    {
      id: 'homework',
      label: '숙제 미제출 확인',
      count: stats.missingHomeworkCount,
      href: '/homework',
      done: stats.missingHomeworkCount === 0,
    },
    {
      id: 'retention',
      label: '재등록 예정 학생',
      count: retentionCount,
      href: '/analytics',
      done: retentionCount === 0,
    },
  ];

  return tasks.filter((t) => t.count > 0 || !t.done);
}

export function TodayTasksPanel({ stats }: { stats: DashboardStats }) {
  const tasks = buildTodayTasks(stats);
  const pending = tasks.filter((t) => !t.done && t.count > 0);
  const done = tasks.filter((t) => t.done);

  return (
    <section
      id="today-tasks"
      className="rounded-2xl overflow-hidden scroll-mt-20"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-xs)',
      }}
    >
      <header className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--app-border)' }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            오늘 할 일
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {pending.length > 0 ? `처리 필요 ${pending.length}건` : '오늘 긴급 업무가 없습니다'}
          </p>
        </div>
        {pending.length > 0 && (
          <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full app-badge-orange">
            {pending.reduce((s, t) => s + t.count, 0)}건
          </span>
        )}
      </header>

      {tasks.length === 0 ? (
        <p className="px-5 py-10 text-sm text-center" style={{ color: 'var(--app-ink-4)' }}>
          오늘 처리할 업무가 없습니다.
        </p>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
          {pending.map((task) => (
            <li key={task.id}>
              <Link
                href={task.href}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--app-surface-2)] transition-colors group"
              >
                <span
                  className="w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: 'var(--app-border-strong)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--app-ink)' }}>
                    {task.label}
                  </p>
                  {task.detail && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                      {task.detail}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-lg app-badge-orange">
                  {task.count}건
                </span>
                <i
                  className="ri-arrow-right-s-line text-lg shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--app-ink-4)' }}
                />
              </Link>
            </li>
          ))}
          {done.map((task) => (
            <li key={task.id} className="opacity-50">
              <div className="flex items-center gap-4 px-5 py-3">
                <span
                  className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--app-success)', borderColor: 'var(--app-success)' }}
                >
                  <i className="ri-check-line text-[10px] text-white" />
                </span>
                <p className="text-sm line-through flex-1" style={{ color: 'var(--app-ink-3)' }}>
                  {task.label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
