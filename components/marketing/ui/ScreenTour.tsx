'use client';

import { useState } from 'react';
import type { ScreenshotKey } from '@/lib/marketing/screenshots';
import { ScreenshotPlaceholder } from './ScreenshotPlaceholder';
import { Button } from './Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Section = { id: string; title: string; desc: string; cta: string };

const SCREENSHOT_MAP: Record<string, ScreenshotKey> = {
  dashboard: 'dashboard',
  'today-workspace': 'today-lesson',
  'student-detail': 'student-hub',
  'parent-app': 'parent-report',
  billing: 'dashboard',
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

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveId(section.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
              activeId === section.id
                ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
            )}
          >
            <i className={TAB_ICONS[section.id] ?? 'ri-window-line'} />
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.8fr]">
        {/* Left: text */}
        <FadeIn key={active?.id}>
          <div className="lg:sticky lg:top-28">
            <p className={cn(mkt.eyebrow, 'mb-2')}>
              {activeIdx + 1} / {sections.length}
            </p>
            <h3 className={cn(mkt.h2, 'text-xl md:text-2xl')}>{active?.title}</h3>
            <p className={cn(mkt.body, 'mt-3')}>{active?.desc}</p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Button href={demoHref} variant="secondary" className="w-full justify-center">
                {active?.cta} →
              </Button>
              <Button href={signupHref} variant="primary" className="w-full justify-center">
                3일 무료 체험 시작
              </Button>
            </div>

            {/* Step dots */}
            <div className="mt-6 flex gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    s.id === activeId ? 'w-6 bg-sky-500' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  )}
                  aria-label={s.title}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Right: screenshot */}
        <FadeIn key={`shot-${active?.id}`} delay={0.05}>
          <ScreenshotPlaceholder
            screenshotKey={SCREENSHOT_MAP[active?.id ?? 'dashboard']}
            className="shadow-2xl shadow-slate-900/10"
          />
        </FadeIn>
      </div>

      {/* Prev / Next */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={activeIdx <= 0}
          onClick={() => setActiveId(sections[activeIdx - 1]?.id ?? '')}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <i className="ri-arrow-left-line" /> 이전
        </button>
        <button
          type="button"
          disabled={activeIdx >= sections.length - 1}
          onClick={() => setActiveId(sections[activeIdx + 1]?.id ?? '')}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          다음 <i className="ri-arrow-right-line" />
        </button>
      </div>
    </div>
  );
}
