'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CONTACT_EMAIL } from '@/lib/brand';
import useEmblaCarousel from 'embla-carousel-react';
import { CF_QUICK_LINKS, CF_HERO_SLIDES } from '@/lib/marketing/siteStructure';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import { HERO_BG, mkt } from '@/lib/marketing/ui';
import { cn } from '@/lib/cn';

export function CfQuickAccess() {
  return (
    <section className="border-b border-slate-100 bg-sky-50/80 py-6">
      <div className={mkt.container}>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
          {CF_QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-xl bg-white px-2 py-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md sm:px-3 sm:py-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-xl text-sky-700">
                  <i className={item.icon} aria-hidden />
                </span>
                <span className="whitespace-pre-line text-[11px] font-semibold leading-tight text-slate-700 sm:text-xs">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CfTrialBanner() {
  return (
    <section className="bg-gradient-to-r from-lime-500 to-green-600 py-8 text-white">
      <div className={cn(mkt.container, 'flex flex-col items-start justify-between gap-4 md:flex-row md:items-center')}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-white/90">
            {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.badge : 'Free Trial'}
          </p>
          <h2 className="mt-1 text-xl font-extrabold md:text-2xl">
            {PROMO_ALL_FREE.active
              ? `${PROMO_ALL_FREE.title} — 카드 등록 없이 시작`
              : '14일 무료 체험 — 카드 등록 없이 시작'}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            {PROMO_ALL_FREE.active
              ? PROMO_ALL_FREE.subtitle
              : 'Demo Academy로 먼저 보고, 우리 학원 데이터로 바로 시작하세요.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/signup" className={mkt.btnOrange}>
            {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '무료 체험 시작'}
          </Link>
          <Link href="/demo" className={mkt.btnOutlineLight}>
            Demo 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CfCustomerCenter() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-10">
      <div className={mkt.container}>
        <h2 className="mb-6 text-lg font-extrabold text-slate-800">고객센터</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">문의 메일</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block text-lg font-bold text-slate-800">
              {CONTACT_EMAIL}
            </a>
            <p className="mt-1 text-sm text-slate-500">평일 09:00 – 18:00</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">도입 상담</p>
            <Link href="/contact" className={cn(mkt.link, 'mt-2 inline-block text-base')}>
              도입·파일럿 문의 →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">자주 찾는 메뉴</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <Link href="/faq" className={mkt.link}>
                FAQ
              </Link>
              <Link href="/security" className={mkt.link}>
                Security
              </Link>
              <Link href="/pricing" className={mkt.link}>
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Home Hero — Carefor 슬라이드 배너 */
export function CfHeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [idx, setIdx] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(timer);
  }, [emblaApi]);

  return (
    <section className="overflow-hidden border-b border-slate-200">
      <div ref={emblaRef}>
        <div className="flex">
          {CF_HERO_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={cn('min-w-0 flex-[0_0_100%] py-12 md:py-16', HERO_BG[slide.tone])}
            >
              <div className={cn(mkt.container, 'grid gap-8 lg:grid-cols-2 lg:items-center')}>
                <div>
                  <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-sky-800">
                    {slide.tag}
                  </span>
                  <h1 className={cn(mkt.h1, 'mt-4')}>{slide.title}</h1>
                  <p className={cn(mkt.lead, 'mt-4 max-w-lg')}>{slide.desc}</p>
                  <Link href={slide.cta.href} className={cn(mkt.btnGreen, 'mt-6 inline-flex')}>
                    {slide.cta.label}
                  </Link>
                </div>
                <div className="hidden aspect-video rounded-2xl border border-white/60 bg-white/40 shadow-lg lg:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(mkt.container, 'flex justify-center gap-2 pb-4')}>
        {CF_HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`슬라이드 ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              idx === i ? 'w-6 bg-sky-600' : 'w-2 bg-slate-300'
            )}
          />
        ))}
      </div>
    </section>
  );
}
