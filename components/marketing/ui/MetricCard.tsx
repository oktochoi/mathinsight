'use client';

import CountUp from 'react-countup';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';

export function MetricCard({
  value,
  suffix = '',
  prefix = '',
  label,
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
  className?: string;
}) {
  return (
    <FadeIn className={cn(mkt.card, 'p-6 md:p-7', className)}>
      <p className="text-3xl font-extrabold tracking-tight text-sky-800 md:text-4xl">
        {prefix}
        <CountUp end={value} duration={1.6} decimals={decimals} enableScrollSpy scrollSpyOnce />
        {suffix}
      </p>
      <p className={cn(mkt.muted, 'mt-2')}>{label}</p>
    </FadeIn>
  );
}
