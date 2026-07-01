'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

function OverviewCard({
  label,
  value,
  sub,
  detail,
  expanded,
  onToggle,
}: {
  label: string;
  value: string;
  sub?: string;
  detail?: string;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const clickable = Boolean(detail && onToggle);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onToggle}
      className={cn(
        'rounded-xl px-4 py-3 min-w-0 text-left transition-colors',
        clickable && 'hover:bg-[var(--app-accent-bg)] cursor-pointer',
        !clickable && 'cursor-default'
      )}
      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-1 truncate" style={{ color: 'var(--app-ink)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>
          {sub}
        </p>
      )}
      {expanded && detail && (
        <p className="text-xs mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--app-ink-2)' }}>
          {detail}
        </p>
      )}
    </button>
  );
}

export function StudentOverviewRow({
  recentAttendance,
  recentHomework,
  recentScore,
  recentCounseling,
  recentParent,
  reregLabel,
  attendanceDetail,
  homeworkDetail,
  scoreDetail,
}: {
  recentAttendance: string;
  recentHomework: string;
  recentScore: string;
  recentCounseling: string;
  recentParent: string;
  reregLabel: string;
  attendanceDetail?: string;
  homeworkDetail?: string;
  scoreDetail?: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <section>
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>
        Student Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <OverviewCard
          label="최근 출석"
          value={recentAttendance}
          detail={attendanceDetail}
          expanded={openKey === 'attendance'}
          onToggle={() => toggle('attendance')}
        />
        <OverviewCard
          label="최근 숙제"
          value={recentHomework}
          detail={homeworkDetail}
          expanded={openKey === 'homework'}
          onToggle={() => toggle('homework')}
        />
        <OverviewCard
          label="최근 성적"
          value={recentScore}
          detail={scoreDetail}
          expanded={openKey === 'score'}
          onToggle={() => toggle('score')}
        />
        <OverviewCard label="최근 상담" value={recentCounseling} />
        <OverviewCard label="최근 부모 소통" value={recentParent} />
        <OverviewCard label="재등록" value={reregLabel} />
      </div>
    </section>
  );
}
