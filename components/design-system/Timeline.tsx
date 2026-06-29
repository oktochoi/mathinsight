'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EduBadge } from './Badge';
import { MutedText } from './Typography';

export type AppTimelineItem = {
  id: string;
  date: string;
  time?: string;
  type?: string;
  title: string;
  summary?: string;
  statusLabel?: string;
  statusPreset?: Parameters<typeof EduBadge>[0]['preset'];
  href?: string;
  action?: React.ReactNode;
};

export function AppTimeline({
  items,
  groupByDate = true,
  emptyPlaceholder = 'Activity Timeline',
  className,
}: {
  items: AppTimelineItem[];
  groupByDate?: boolean;
  emptyPlaceholder?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="app-chart-placeholder min-h-[8rem]" role="status">
        [ Empty State Placeholder — {emptyPlaceholder} ]
      </div>
    );
  }

  const groups = groupByDate ? groupItemsByDate(items) : [['', items] as const];

  return (
    <div className={cn('relative', className)}>
      <div className="app-timeline-spine left-[7px]" />
      <ul className="space-y-8">
        {groups.map(([date, dayItems]) => (
          <li key={date || 'all'}>
            {groupByDate && date && (
              <MutedText className="font-bold tabular-nums mb-3 pl-6 block">{date}</MutedText>
            )}
            <ul className="space-y-4">
              {dayItems.map((item) => (
                <AppTimelineRow key={item.id} item={item} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppTimelineRow({ item }: { item: AppTimelineItem }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {item.type && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
          >
            {item.type}
          </span>
        )}
        {item.statusPreset && <EduBadge preset={item.statusPreset} size="sm" />}
        {!item.statusPreset && item.statusLabel && (
          <EduBadge label={item.statusLabel} size="sm" />
        )}
        {item.time && (
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--app-ink-4)' }}>
            {item.time}
          </span>
        )}
      </div>
      <p className="text-sm font-medium mt-1.5" style={{ color: 'var(--app-ink)' }}>
        {item.title}
      </p>
      {item.summary && (
        <MutedText className="mt-0.5 leading-relaxed">{item.summary}</MutedText>
      )}
      {item.action && <div className="mt-2">{item.action}</div>}
    </>
  );

  return (
    <li className="flex gap-4 pl-1">
      <div
        className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10"
        style={{ background: 'var(--app-accent)', border: '2px solid var(--app-surface)' }}
      />
      <div className="min-w-0 flex-1 pb-1">
        {item.href ? (
          <Link href={item.href} className="block hover:opacity-80 transition-opacity">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </li>
  );
}

function groupItemsByDate(items: AppTimelineItem[]): [string, AppTimelineItem[]][] {
  const map = new Map<string, AppTimelineItem[]>();
  for (const item of items) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }
  return [...map.entries()].sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );
}
