'use client';

import { cn } from '@/lib/cn';
import { ChartCardShell } from './Card';
import { MutedText } from './Typography';

export function ChartPlaceholder({
  label,
  height = 'md',
  className,
}: {
  label: string;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const heightClass = height === 'sm' ? 'min-h-[6rem]' : height === 'lg' ? 'min-h-[14rem]' : 'min-h-[10rem]';

  return (
    <div className={cn('app-chart-placeholder', heightClass, className)} role="img" aria-label={label}>
      [ Chart Placeholder — {label} ]
    </div>
  );
}

export function ChartPlaceholderCard({
  title,
  description,
  label,
  legend,
  action,
  height,
  className,
}: {
  title: string;
  description?: string;
  label: string;
  legend?: { label: string; color?: string }[];
  action?: React.ReactNode;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <ChartCardShell title={title} description={description} action={action} className={className}>
      <ChartPlaceholder label={label} height={height} />
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.color ?? 'var(--app-accent)' }}
              />
              <MutedText>{item.label}</MutedText>
            </div>
          ))}
        </div>
      )}
    </ChartCardShell>
  );
}
