'use client';

import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Step = { title: string; desc?: string };

/** Product 페이지용 Premium Workflow Timeline */
export function PremiumWorkflowTimeline({
  steps,
  className,
}: {
  steps: readonly Step[];
  className?: string;
}) {
  return (
    <Reveal className={cn('relative max-w-2xl mx-auto', className)}>
      <div
        className="absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 hidden md:block"
        style={{ background: 'linear-gradient(to bottom, #bae6fd, #38bdf8, #0ea5e9)' }}
        aria-hidden
      />
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const isLeft = i % 2 === 0;
          return (
            <RevealItem key={step.title}>
              <li className="relative pb-10 md:pb-12">
                <div
                  className={cn(
                    'flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-8 md:items-center',
                    !isLeft && 'md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1'
                  )}
                >
                  <div className={cn('md:text-right', !isLeft && 'md:text-left')}>
                    {i > 0 && (
                      <span className="text-xs font-semibold text-sky-600 mb-1 block md:hidden">↓</span>
                    )}
                    <div
                      className={cn(
                        'inline-block rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-sm shadow-sky-100/50 text-left',
                        isLeft ? 'md:ml-auto' : 'md:mr-auto'
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
                        Step {i + 1}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{step.title}</h3>
                      {step.desc && <p className={cn(mkt.muted, 'mt-1.5')}>{step.desc}</p>}
                    </div>
                  </div>

                  <div className="hidden md:flex justify-center">
                    <span
                      className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sm font-bold text-sky-700 shadow-md"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                  </div>

                  <div className="hidden md:block" aria-hidden />
                </div>

                {i < steps.length - 1 && (
                  <p className="text-center text-sky-400 text-lg font-light mt-2 md:hidden" aria-hidden>
                    ↓
                  </p>
                )}
              </li>
            </RevealItem>
          );
        })}
      </ol>
    </Reveal>
  );
}
