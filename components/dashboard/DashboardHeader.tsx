'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { DashboardStats } from '@/types/database';
import { buildOperationsSummary } from '@/lib/dashboardOperations';
import { cn } from '@/lib/cn';

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function greetingText(name?: string) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고하셨어요';
  return name ? `${greeting}, ${name}님` : greeting;
}

const QUICK_ACTIONS = [
  { href: '/lesson-logs', icon: 'ri-book-open-line',    label: '수업 기록' },
  { href: '/students',    icon: 'ri-group-line',         label: '학생' },
  { href: '/counseling',  icon: 'ri-chat-smile-3-line',  label: '상담' },
  { href: '/schedule',    icon: 'ri-calendar-line',      label: '시간표' },
  { href: '/parent-hub',  icon: 'ri-mail-line',          label: '학부모' },
] as const;

const CHIP_TONE_CLASS: Record<string, string> = {
  neutral: 'bg-[var(--app-surface-2)] text-[var(--app-ink-2)]',
  warning: 'bg-[#fffbeb] text-[#b45309] border border-amber-200/60',
  danger:  'bg-[#fef2f2] text-[#b91c1c] border border-red-200/60',
  info:    'bg-[var(--app-accent-bg)] text-[var(--app-accent-text)]',
};

export function DashboardHeader({
  stats,
  onRefresh,
}: {
  stats: DashboardStats;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const isTeacher = stats.dashboardMode === 'teacher';
  const summary = buildOperationsSummary(stats);

  return (
    <header className="space-y-3">
      {/* Morning brief card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--s-sm)',
        }}
      >
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* Greeting + date */}
            <div className="min-w-0">
              <p
                className="text-xs font-medium mb-1"
                style={{ color: 'var(--app-ink-3)' }}
                suppressHydrationWarning
              >
                {todayLabel()} · {isTeacher ? '강사 업무판' : '운영 대시보드'}
              </p>
              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
                suppressHydrationWarning
              >
                {greetingText(profile?.name)}
              </h1>

              {/* Summary chips */}
              {summary.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {summary.map((chip) => {
                    const cls = CHIP_TONE_CLASS[chip.tone] ?? CHIP_TONE_CLASS.neutral;
                    const inner = (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                          cls
                        )}
                      >
                        {chip.label}
                        <span className="font-bold tabular-nums">
                          {chip.value}{chip.unit}
                        </span>
                      </span>
                    );
                    return chip.href ? (
                      <Link key={chip.label} href={chip.href} className="hover:opacity-80 transition-opacity">
                        {inner}
                      </Link>
                    ) : (
                      <span key={chip.label}>{inner}</span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/lesson-logs"
                className="app-btn app-btn-primary text-sm"
              >
                <i className="ri-book-open-line" />
                수업 입력
              </Link>
              <button
                type="button"
                onClick={onRefresh}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border-md)',
                  color: 'var(--app-ink-3)',
                }}
                aria-label="새로고침"
              >
                <i className="ri-refresh-line text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Quick actions bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          className="relative flex-1 max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            router.push(q ? `/students?q=${encodeURIComponent(q)}` : '/students');
          }}
        >
          <i
            className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: 'var(--app-ink-3)' }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="학생 이름 검색..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/20 focus:border-[var(--app-accent)] transition-colors"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border-md)',
              color: 'var(--app-ink)',
            }}
          />
        </form>

        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border-md)',
                color: 'var(--app-ink-2)',
              }}
            >
              <i className={cn(action.icon, 'text-xs')} style={{ color: 'var(--app-ink-3)' }} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
