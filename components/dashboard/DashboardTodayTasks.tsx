'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';
import { cn } from '@/lib/cn';

type TaskItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  urgent?: boolean;
};

export function DashboardTodayTasks({ stats }: { stats: DashboardStats }) {
  const tasks: TaskItem[] = [
    {
      id: 'counseling',
      label: '상담',
      count: stats.pendingConsultationCount,
      href: '/counseling',
      urgent: stats.pendingConsultationCount > 0,
    },
    {
      id: 'homework',
      label: '숙제 미제출',
      count: stats.missingHomeworkCount,
      href: '/homework?filter=missing',
      urgent: stats.missingHomeworkCount > 0,
    },
    {
      id: 'absent',
      label: '결석',
      count: stats.absentTodayCount,
      href: '/attendance',
      urgent: stats.absentTodayCount > 0,
    },
    {
      id: 'messages',
      label: '학부모 문의',
      count: stats.pendingParentMessagesCount,
      href: '/messages',
      urgent: stats.pendingParentMessagesCount > 0,
    },
    {
      id: 'lessons',
      label: '오늘 수업',
      count: stats.todayLessonCount,
      href: '/schedule',
    },
  ].filter((t) => t.count > 0 || t.id === 'lessons');

  const secondary: TaskItem[] = [
    {
      id: 'billing',
      label: '수강료 연체',
      count: stats.overduePaymentsCount,
      href: '/billing',
      urgent: stats.overduePaymentsCount > 0,
    },
    {
      id: 'retention',
      label: '상담 권장',
      count: stats.retentionHighRiskCount,
      href: '/retention',
      urgent: stats.retentionHighRiskCount > 0,
    },
    {
      id: 'late',
      label: '지각',
      count: stats.lateTodayCount,
      href: '/attendance',
    },
  ].filter((t) => t.count > 0);

  return (
    <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>오늘 해야 할 일</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>항목을 누르면 해당 업무 화면으로 이동합니다.</p>
      </div>
      <ul className="divide-y divide-[var(--app-border)]">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link
              href={task.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--app-surface-2)]"
            >
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', task.urgent ? 'bg-rose-500' : '')}
                style={task.urgent ? undefined : { background: 'var(--app-border-md)' }}
              />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--app-ink)' }}>
                {task.label}{' '}
                <span className="tabular-nums font-normal" style={{ color: 'var(--app-ink-3)' }}>
                  {task.id === 'lessons' ? `${task.count}개` : `${task.count}건`}
                </span>
              </span>
              <i className="ri-arrow-right-s-line" style={{ color: 'var(--app-ink-4)' }} />
            </Link>
          </li>
        ))}
        {tasks.length === 1 && (
          <li className="px-5 py-6 text-center text-sm" style={{ color: 'var(--app-ink-3)' }}>
            긴급 업무가 없습니다. 수업 기록을 입력해 주세요.
          </li>
        )}
      </ul>
      {secondary.length > 0 && (
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ background: 'var(--app-surface-2)', borderTop: '1px solid var(--app-border)' }}>
          {secondary.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border font-medium',
                t.urgent ? 'border-rose-200 bg-rose-50 text-rose-800' : ''
              )}
              style={t.urgent ? undefined : { border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink-2)' }}
            >
              {t.label} {t.count}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
