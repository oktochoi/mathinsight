'use client';

import { useState } from 'react';
import { DEMO_TOUR_SECTIONS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import type { ScreenshotKey } from '@/lib/marketing/screenshots';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { VideoPlaceholder } from '@/components/marketing/ui/VideoPlaceholder';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Button } from '@/components/marketing/ui/Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

const SCREENSHOT_MAP: Record<string, ScreenshotKey> = {
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

export function DemoPageContent() {
  const [activeId, setActiveId] = useState<string>(DEMO_TOUR_SECTIONS[0].id);
  const active = DEMO_TOUR_SECTIONS.find((s) => s.id === activeId) ?? DEMO_TOUR_SECTIONS[0];
  const activeIdx = DEMO_TOUR_SECTIONS.findIndex((s) => s.id === activeId);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-sky-50/60 py-14 md:py-20">
        <div className={cn(mkt.container, 'text-center')}>
          <FadeIn>
            <p className={cn(mkt.eyebrow, 'mb-3')}>Demo</p>
            <h1 className={mkt.h1}>실제 제품을 체험하는 느낌으로</h1>
            <p className={cn(mkt.lead, 'mt-4 mx-auto max-w-xl')}>
              「데모 수학학원」 샘플 데이터로 EduFlow 핵심 화면을 빠르게 둘러보세요.
              로그인 없이 먼저 확인하거나, 데모 계정으로 직접 조작해 볼 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href={MARKETING_ROUTES.auth} variant="secondary">
                <i className="ri-login-box-line mr-1.5" />
                데모 계정 로그인
              </Button>
              <Button href={MARKETING_ROUTES.signup} variant="primary">
                무료 체험 시작
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── INTRO VIDEO ──────────────────────────────── */}
      <Section muted size="sm">
        <SectionInner narrow>
          <VideoPlaceholder
            title="EduFlow 핵심 기능 2분 투어"
            subtitle="Dashboard → 학생 상세 → 학부모 리포트까지"
            duration="2:05"
            accent="indigo"
          />
        </SectionInner>
      </Section>

      {/* ── INTERACTIVE TOUR ─────────────────────────── */}
      <Section>
        <SectionInner>
          <div className="text-center mb-8">
            <p className={cn(mkt.eyebrow, 'mb-2')}>Product Tour</p>
            <h2 className={mkt.h2}>화면별 기능 확인</h2>
          </div>

          {/* Tab navigation */}
          <div className="flex overflow-x-auto gap-2 pb-1 mb-8 justify-center">
            {DEMO_TOUR_SECTIONS.map((section, i) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={cn(
                  'flex flex-none items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap',
                  activeId === section.id
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                )}
              >
                <i className={TAB_ICONS[section.id]} />
                {section.title}
              </button>
            ))}
          </div>

          {/* Active section */}
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.8fr]">
            {/* Left: text */}
            <FadeIn key={active.id}>
              <div className="lg:sticky lg:top-28">
                <p className={cn(mkt.eyebrow, 'mb-2')}>
                  {activeIdx + 1} / {DEMO_TOUR_SECTIONS.length}
                </p>
                <h3 className={cn(mkt.h2, 'text-xl md:text-2xl')}>{active.title}</h3>
                <p className={cn(mkt.body, 'mt-3')}>{active.desc}</p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <Button href={MARKETING_ROUTES.auth} variant="secondary" className="w-full justify-center">
                    {active.cta} →
                  </Button>
                  <Button href={MARKETING_ROUTES.signup} variant="primary" className="w-full justify-center">
                    무료 체험으로 시작
                  </Button>
                </div>

                {/* Step dots */}
                <div className="mt-6 flex gap-2">
                  {DEMO_TOUR_SECTIONS.map((s) => (
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
            <FadeIn key={`screenshot-${active.id}`} delay={0.05}>
              <ScreenshotPlaceholder
                screenshotKey={SCREENSHOT_MAP[active.id]}
                className="shadow-2xl shadow-slate-900/10"
              />
            </FadeIn>
          </div>

          {/* Prev / Next navigation */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              disabled={activeIdx === 0}
              onClick={() => setActiveId(DEMO_TOUR_SECTIONS[activeIdx - 1]?.id)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="ri-arrow-left-line" /> 이전
            </button>
            <button
              type="button"
              disabled={activeIdx === DEMO_TOUR_SECTIONS.length - 1}
              onClick={() => setActiveId(DEMO_TOUR_SECTIONS[activeIdx + 1]?.id)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              다음 <i className="ri-arrow-right-line" />
            </button>
          </div>
        </SectionInner>
      </Section>

      {/* ── ALL SCREENSHOTS GRID ─────────────────────── */}
      <Section muted>
        <SectionInner>
          <div className="text-center mb-8">
            <p className={cn(mkt.eyebrow, 'mb-2')}>모든 화면</p>
            <h2 className={cn(mkt.h2, 'text-xl')}>한눈에 보기</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_TOUR_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveId(section.id);
                  document.querySelector('#interactive-tour')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group text-left"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-sky-300 hover:shadow-md">
                  <ScreenshotPlaceholder screenshotKey={SCREENSHOT_MAP[section.id]} />
                  <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <i className={cn(TAB_ICONS[section.id], 'text-sky-600')} />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-sky-700">{section.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{section.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionInner>
      </Section>

      <CTASection
        title="체험 후 바로 우리 학원으로 시작하세요"
        description="3일 무료 체험 · 카드 등록 없이 시작"
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.product, label: 'Product 스토리 보기' }}
        variant="light"
      />
    </>
  );
}
