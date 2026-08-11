'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { RecordJourney } from '@/components/marketing/home/RecordJourney';
import { HomeHeroConsole } from '@/components/marketing/home/HomeHeroConsole';
import { Section } from '@/components/marketing/ui/Section';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import { EASE, DURATION } from '@/lib/motion';

const WIDE = 'mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16';

/** Journey가 서사를 끝내므로, 하단은 "어디를 더 볼지"만 조용히 안내 */
const NEXT_STOPS = [
  {
    href: MARKETING_ROUTES.product,
    area: '제품 둘러보기',
    covers: '운영 · AI · 상담이 한 화면에서 어떻게 붙는지',
  },
  {
    href: MARKETING_ROUTES.academyManagement,
    area: '학원 관리',
    covers: '출결 · 숙제 · 성적 · 시간표',
  },
  {
    href: MARKETING_ROUTES.academyConsulting,
    area: '상담 관리',
    covers: '상담 준비부터 학부모 전달까지',
  },
  {
    href: MARKETING_ROUTES.retention,
    area: '재등록 관리',
    covers: '이탈 신호 · 수납 · 재등록 파이프라인',
  },
] as const;

export function HomePageContent() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const consoleY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const consoleOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  return (
    <>
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative flex flex-col overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7faf8_100%)] md:min-h-[calc(100dvh-72px)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(100%_70%_at_50%_0%,black,transparent_75%)]"
        />

        <div className={cn(WIDE, 'relative pb-10 pt-[8vh] md:pb-12 md:pt-[10vh]')}>
          <FadeIn y={10}>
            <p className="text-sm font-semibold tracking-wide text-teal-800">
              학원 운영 · 상담 · 재등록을 한 흐름으로
            </p>
          </FadeIn>

          <FadeIn delay={0.05} y={16}>
            <h1 className="mkt-display mt-5 max-w-[18ch] text-[clamp(2.4rem,5.8vw,4.4rem)] text-slate-900">
              기록이 상담이 되고
              <br />
              상담이 <span className="text-emerald-700">재등록</span>을 지킵니다
            </h1>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.75] tracking-[-0.012em] text-slate-600 md:text-lg">
              수업 기록이 쌓이면 상담 브리핑이 준비되고, 흔들리는 학생은 결제일보다 먼저 보입니다.
            </p>
          </FadeIn>

          <FadeIn delay={0.16}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={MARKETING_ROUTES.contact} className={cn(mkt.btnGreen, 'group px-7 py-3.5 text-[15px]')}>
                도입 문의하기
                <i className="ri-arrow-right-line ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`${MARKETING_ROUTES.product}#tour`}
                className={cn(mkt.btnOutline, 'px-7 py-3.5 text-[15px]')}
              >
                제품 화면 보기
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {PROMO_ALL_FREE.active
                ? '카드 등록 없음 · 행사 기간 전 기능 무료'
                : '카드 등록 없음 · 3일 무료 체험'}
            </p>
          </FadeIn>
        </div>

        {/* 콘솔 — 입장과 스크롤 패럴랙스를 레이어로 분리 */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, delay: 0.28, ease: EASE }}
          className="relative mt-auto h-[300px] overflow-hidden sm:h-[360px] lg:h-[420px]"
        >
          <motion.div style={{ y: consoleY, opacity: consoleOpacity }} className="h-full">
            <HomeHeroConsole />
          </motion.div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute inset-x-0 bottom-5 z-10 flex justify-center"
        >
          <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">SCROLL</p>
        </motion.div>
      </section>

      {/* ── 서사 (스크롤 스크럽) ── */}
      <RecordJourney />

      {/* ── 다음으로 볼 곳 — Journey와 메시지 중복 없이 짧게 ── */}
      <Section className="border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9f8_100%)] py-20 md:py-24">
        <div className={WIDE}>
          <FadeIn className="max-w-xl">
            <p className={cn(mkt.eyebrow, 'mb-3')}>Explore</p>
            <h2 className="mkt-display text-[clamp(1.75rem,3.2vw,2.35rem)] text-slate-900">
              방금 본 흐름을
              <br />
              영역별로 더 볼 수 있습니다
            </h2>
          </FadeIn>

          <Reveal className="mt-10 grid gap-3 sm:grid-cols-2" stagger={0.07}>
            {NEXT_STOPS.map((item) => (
              <RevealItem key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/5 md:p-6"
                >
                  <div>
                    <p className="text-[16px] font-bold tracking-tight text-slate-900 group-hover:text-teal-800">
                      {item.area}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{item.covers}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 opacity-80 transition-all group-hover:gap-1.5 group-hover:opacity-100">
                    자세히 보기
                    <i className="ri-arrow-right-line" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>

      <CTASection
        variant="green"
        title="도입 상담 후 바로 시작할 수 있습니다"
        description="카드 등록 없음 · 메일 한 통이면 충분합니다."
        primary={{
          href: MARKETING_ROUTES.contact,
          label: '도입 문의하기',
          variant: 'accent',
        }}
        secondary={{ href: `${MARKETING_ROUTES.product}#tour`, label: '제품 화면 보기' }}
      />
    </>
  );
}
