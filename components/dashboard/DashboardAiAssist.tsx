'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProactiveAgentBanner } from '@/components/dashboard/ProactiveAgentBanner';
import { AgentWorkflowPanel, type AgentJobRow } from '@/components/dashboard/AgentWorkflowPanel';
import { AgentActionFeed, type AgentFeedItem } from '@/components/dashboard/AgentActionFeed';

/** 원장용 — AI 자동 기능을 한곳에, 기술 용어 최소화 */
export function DashboardAiAssist({
  notifications,
  jobs,
  feed,
  loading,
}: {
  notifications: {
    consultation: number;
    makeup: number;
    attention: number;
    message: string;
  };
  jobs: AgentJobRow[];
  feed: AgentFeedItem[];
  loading?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const hasActivity =
    notifications.consultation + notifications.makeup + notifications.attention > 0 ||
    jobs.length > 0 ||
    feed.length > 0;

  if (!hasActivity && !loading) return null;

  return (
    <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors cursor-pointer hover:bg-[var(--app-surface-2)]"
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>자동으로 준비된 내용</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            수업 기록을 분석해 상담·리포트 초안을 미리 만들어 둡니다. 확인만 하시면 됩니다.
          </p>
        </div>
        <i
          className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-xl shrink-0`}
          style={{ color: 'var(--app-ink-4)' }}
          aria-hidden
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 pt-4" style={{ borderTop: '1px solid var(--app-border)' }}>
          <ProactiveAgentBanner
            message={notifications.message}
            consultation={notifications.consultation}
            makeup={notifications.makeup}
            attention={notifications.attention}
          />

          <div className="grid lg:grid-cols-2 gap-5">
            <AgentWorkflowPanel jobs={jobs} loading={loading} />
            <AgentActionFeed feed={feed} loading={loading} />
          </div>

          <p className="text-xs leading-relaxed rounded-xl px-4 py-3" style={{ color: 'var(--app-ink-3)', background: 'var(--app-surface-2)' }}>
            <strong style={{ color: 'var(--app-ink-2)' }}>참고:</strong> 학부모 앱의 「AI 학습 상담」은
            별도 기능입니다. 여기서는 <strong>원장님용</strong> 상담 카드·주간 리포트 초안만
            자동 생성됩니다.{' '}
            <Link href="/consultation-cards" className="font-medium hover:underline" style={{ color: 'var(--app-accent)' }}>
              상담 카드 보기
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
