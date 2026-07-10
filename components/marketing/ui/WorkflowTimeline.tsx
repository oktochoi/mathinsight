'use client';

import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Step = { title: string; desc: string };

export function WorkflowTimeline({ steps, className }: { steps: readonly Step[]; className?: string }) {
  return (
    <Reveal className={cn('relative', className)}>
      <div className="absolute left-[15px] top-2 bottom-2 hidden w-px bg-zinc-200 md:block" aria-hidden />
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <RevealItem key={step.title}>
            <li className="relative flex gap-5 pb-8 md:pb-10">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                <p className={cn(mkt.muted, 'mt-1 max-w-md')}>{step.desc}</p>
              </div>
            </li>
          </RevealItem>
        ))}
      </ol>
    </Reveal>
  );
}

export function WorkflowStoryBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <FadeIn className={cn('mx-auto max-w-2xl space-y-0', className)}>
      {children}
    </FadeIn>
  );
}

export function WorkflowStoryLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-zinc-200 py-4 text-[15px] leading-relaxed text-zinc-600 last:border-0">
      {children}
    </p>
  );
}
