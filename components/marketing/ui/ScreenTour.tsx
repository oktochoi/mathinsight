'use client';

import { useState } from 'react';
import {
  MarketingScreenMockup,
  type MarketingScreenVariant,
} from '@/components/marketing/ui/MarketingScreenMockup';
import { Button } from './Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Section = { id: string; title: string; desc: string; cta: string };

const SCREEN_VARIANT: Record<string, MarketingScreenVariant> = {
  dashboard: 'dashboard',
  'today-workspace': 'today-lesson',
  'student-detail': 'student-hub',
  'parent-app': 'parent-report',
  billing: 'billing',
};

const TAB_ICONS: Record<string, string> = {
  dashboard: 'ri-home-4-line',
  'today-workspace': 'ri-book-open-line',
  'student-detail': 'ri-user-heart-line',
  'parent-app': 'ri-parent-line',
  billing: 'ri-wallet-3-line',
};

type Props = {
  sections: Section[];
  demoHref: string;
  signupHref: string;
};

export function ScreenTour({ sections, demoHref, signupHref }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const activeIdx = sections.findIndex((s) => s.id === activeId);
  const variant = SCREEN_VARIANT[active?.id ?? 'dashboard'] ?? 'dashboard';

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveId(section.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap',
              activeId === section.id
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-teal-700'
            )}
          >
            <i className={TAB_ICONS[section.id] ?? 'ri-window-line'} />
            {section.title}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.6fr]">
        <FadeIn key={active?.id}>
          <div className="lg:sticky lg:top-28">
            <p className={cn(mkt.eyebrow, 'mb-1')}>
              {activeIdx + 1} / {sections.length}
            </p>
            <h3 className={cn(mkt.h2, 'text-xl md:text-2xl')}>{active?.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{active?.desc}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button href={demoHref} variant="primary">
                {active?.cta} →
              </Button>
              <Button href={signupHref} variant="secondary">
                무료 체험
              </Button>
            </div>

            <div className="mt-5 flex gap-1.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    s.id === activeId ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                  )}
                  aria-label={s.title}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn key={`shot-${active?.id}`} delay={0.05}>
          <MarketingScreenMockup variant={variant} />
        </FadeIn>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          disabled={activeIdx <= 0}
          onClick={() => setActiveId(sections[activeIdx - 1]?.id ?? '')}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:border-emerald-300 disabled:opacity-30"
        >
          <i className="ri-arrow-left-line" /> 이전
        </button>
        <button
          type="button"
          disabled={activeIdx >= sections.length - 1}
          onClick={() => setActiveId(sections[activeIdx + 1]?.id ?? '')}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:border-emerald-300 disabled:opacity-30"
        >
          다음 <i className="ri-arrow-right-line" />
        </button>
      </div>
    </div>
  );
}
