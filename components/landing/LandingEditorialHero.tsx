'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { FloatY, HoverBounce } from '@/components/landing/motion';

const ease = [0.22, 1, 0.36, 1] as const;

const riseContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const riseItem = {
  hidden: { opacity: 0, y: 52 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease },
  },
};

const HERO_BULLETS = [
  { icon: 'ri-cloud-line', text: '웹에서 설치 없이 사용' },
  { icon: 'ri-git-branch-line', text: '수업·시험·숙제·상담 기록 통합' },
  {
    icon: 'ri-time-line',
    text: '학부모 24시간 AI — 자녀 학습·진도·상담 맥락 문의',
  },
];

const ROLE_ENTRIES = [
  { label: '원장·강사', href: '/auth', icon: 'ri-building-4-line' },
  { label: '학부모', href: '/parent', icon: 'ri-parent-line' },
  { label: '학생', href: '/student', icon: 'ri-graduation-cap-line' },
];

export function LandingEditorialHero() {
  return (
    <section
      id="hero"
      className="relative pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-8 lg:px-12 scroll-mt-16 overflow-hidden"
    >
      <motion.div
        className="absolute top-[15%] right-[5%] w-[min(480px,60vw)] h-[360px] rounded-full bg-indigo-400/20 blur-[90px] pointer-events-none soft-glow-drift"
        aria-hidden
      />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
        <motion.div
          className="relative lg:-mt-4"
          variants={riseContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={riseItem} className="mb-5 flex flex-wrap items-center gap-2">
            <span className="soft-hero-badge">교육 AI 워크플로우</span>
            <span className="soft-label !mb-0 !tracking-[0.12em]">{BRAND_NAME}</span>
          </motion.div>
          <motion.h1 variants={riseItem} className="soft-headline soft-headline-lg">
            학생 기록부터
            <br />
            <span className="soft-accent">학부모 AI</span>까지
          </motion.h1>
          <motion.p variants={riseItem} className="mt-6 text-base sm:text-lg soft-body max-w-lg">
            {BRAND_TAGLINE}
            <br className="hidden sm:block" />
            수업·시험·상담 기록을 통합하고, 학부모는 24시간 포털에서 자녀 학습 현황을
            AI에게 문의합니다.
          </motion.p>

          <motion.div variants={riseItem} className="mt-9 flex flex-wrap gap-3">
            <HoverBounce>
              <Link href="/signup" className="soft-btn-primary">
                시작하기
              </Link>
            </HoverBounce>
            <HoverBounce>
              <a href="#scene" className="soft-btn-ghost">
                화면 예시 보기
              </a>
            </HoverBounce>
          </motion.div>

          <motion.div variants={riseItem} className="mt-8">
            <p className="text-[11px] font-semibold text-slate-500/90 mb-2.5">역할별 바로가기</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_ENTRIES.map((role) => (
                <Link key={role.href} href={role.href} className="soft-role-pill group">
                  <i
                    className={`${role.icon} text-sm text-indigo-500 group-hover:text-indigo-600 transition-colors`}
                    aria-hidden
                  />
                  {role.label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.ul variants={riseItem} className="mt-10 flex flex-col gap-3.5">
            {HERO_BULLETS.map((item, i) => (
              <motion.li
                key={item.text}
                className="flex items-center gap-3 text-sm soft-body"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.7, ease }}
              >
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-50 flex items-center justify-center shrink-0 shadow-sm border border-white/80">
                  <i className={`${item.icon} text-indigo-500 text-base`}></i>
                </span>
                {item.text}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          className="relative lg:pl-6 lg:-mr-6"
          initial={{ opacity: 0, y: 64 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease }}
        >
          <FloatY range={14} duration={6}>
            <LandingHeroVisual />
          </FloatY>
        </motion.div>
      </div>
    </section>
  );
}
