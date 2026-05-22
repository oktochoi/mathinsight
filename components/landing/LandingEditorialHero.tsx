'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual';
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
  { icon: 'ri-sparkling-2-line', text: '설치 없이 바로 시작' },
  { icon: 'ri-git-branch-line', text: '기록이 흐름으로 이어져요' },
  { icon: 'ri-cup-line', text: '상담 준비, 조금 가벼워져요' },
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
          <motion.p variants={riseItem} className="soft-label mb-5">
            학생 기록의 흐름
          </motion.p>
          <motion.h1 variants={riseItem} className="soft-headline soft-headline-lg">
            시험·숙제·상담 기록,
            <br />
            이제 <span className="soft-accent">따로 찾지 마세요</span>.
          </motion.h1>
          <motion.p variants={riseItem} className="mt-6 text-base sm:text-lg soft-body max-w-lg">
            흩어진 메모 대신, 한 화면에서 이어져요.
            <br className="hidden sm:block" />
            상담 준비도 조금 더 가벼워집니다.
          </motion.p>

          <motion.div variants={riseItem} className="mt-9 flex flex-wrap gap-3">
            <HoverBounce>
              <Link href="/signup" className="soft-btn-primary">
                무료로 시작하기
              </Link>
            </HoverBounce>
            <HoverBounce>
              <a href="#scene" className="soft-btn-ghost">
                화면 예시 보기
              </a>
            </HoverBounce>
          </motion.div>

          <motion.ul variants={riseItem} className="mt-12 flex flex-col gap-3.5">
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
