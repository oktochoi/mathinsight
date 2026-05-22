'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeUp, FloatY, HoverBounce } from '@/components/landing/motion';

export function LandingEditorialCta() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 lg:px-12 pb-28">
      <FadeUp className="max-w-6xl mx-auto">
        <div className="relative soft-cta-shell px-8 sm:px-12 py-12 sm:py-16 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-violet-400/25 blur-[70px] pointer-events-none"
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
            transition={{ duration: 7, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-sky-300/30 blur-[60px] pointer-events-none"
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity }}
          />

          <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <p className="soft-label mb-4">시작해볼까요</p>
              <h2 className="soft-headline soft-headline-md">
                이제 상담도
                <br />
                <span className="soft-accent">조금 더 가벼워집니다</span>
              </h2>
              <p className="mt-5 soft-body max-w-md">
                7일 무료로 시작해 보세요.
                <br />
                흐름이 남을 거예요.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <HoverBounce>
                  <Link href="/signup" className="soft-btn-primary">
                    무료로 시작하기
                  </Link>
                </HoverBounce>
                <HoverBounce>
                  <a href="#hero" className="soft-btn-ghost">
                    화면 예시 보기
                  </a>
                </HoverBounce>
              </div>
            </div>

            <FloatY range={10} duration={5}>
              <motion.div
                className="hidden sm:flex items-center justify-center w-40 h-40 lg:w-48 lg:h-48 rounded-[1.75rem] bg-white/50 backdrop-blur-md border border-white/70 shadow-xl shadow-indigo-200/40"
                whileHover={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 0.6 }}
                aria-hidden
              >
                <motion.i
                  className="ri-bar-chart-grouped-fill text-7xl lg:text-8xl text-indigo-400"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
            </FloatY>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
