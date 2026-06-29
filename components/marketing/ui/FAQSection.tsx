'use client';

import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';

type Item = { q: string; a: string };

export function FAQSection({
  items,
  defaultOpen = 0,
  className,
}: {
  items: readonly Item[];
  defaultOpen?: number | null;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const [parent] = useAutoAnimate();

  return (
    <FadeIn className={cn('mx-auto max-w-3xl', className)}>
      <div ref={parent} className="flex flex-col gap-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={cn(mkt.card, 'overflow-hidden', isOpen && 'border-zinc-300')}
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="text-[15px] font-medium text-zinc-900">{item.q}</span>
                <span className="mt-0.5 shrink-0 text-lg leading-none text-zinc-400">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </FadeIn>
  );
}
