'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FadeUp } from '@/components/landing/motion';

const STEPS = [
  { icon: 'ri-file-copy-line', label: '흩어진 기록' },
  { icon: 'ri-stack-line', label: '자동 정리' },
  { icon: 'ri-line-chart-line', label: '패턴 분석' },
  { icon: 'ri-calendar-check-line', label: '상담 준비' },
  { icon: 'ri-checkbox-circle-line', label: '상담 완료' },
];

const WAVE =
  'M 0 64 Q 120 20, 240 64 T 480 64 T 720 64 T 960 64 T 1200 64';

export function LandingProcessFlow() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      id="flow"
      className="relative py-20 sm:py-28 px-4 sm:px-8 lg:px-12 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <p className="soft-label mb-3">흐름이 남습니다</p>
          <p className="text-sm soft-body max-w-md mx-auto">
            기록이 모이고, 상담까지 부드럽게 이어져요.
          </p>
        </FadeUp>

        <div className="relative h-32 sm:h-40 mb-12 sm:mb-14">
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 1200 128"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="process-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.5" />
              </linearGradient>
              <filter id="wave-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={WAVE}
              fill="none"
              stroke="rgba(199, 210, 254, 0.6)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <motion.path
              d={WAVE}
              fill="none"
              stroke="url(#process-wave-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#wave-glow)"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            />
            {inView && (
              <motion.circle
                r="10"
                fill="#6366f1"
                style={{
                  offsetPath: `path('${WAVE}')`,
                  offsetRotate: '0deg',
                  filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))',
                }}
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{
                  offsetDistance: { duration: 6, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            )}
            {inView && (
              <motion.circle
                r="6"
                fill="#a5b4fc"
                style={{
                  offsetPath: `path('${WAVE}')`,
                  offsetRotate: '0deg',
                }}
                animate={{ offsetDistance: ['100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </svg>

          <div className="absolute inset-0 flex justify-between items-center px-[1%]">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                className="flex flex-col items-center w-[18%]"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300 }}
                whileHover={{ y: -6, scale: 1.08 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/80 shadow-lg shadow-indigo-100/50 flex items-center justify-center">
                  <i className={`${step.icon} text-xl text-indigo-500`}></i>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2">
          {STEPS.map((step, i) => (
            <FadeUp key={step.label} delay={i * 0.04}>
              <p className="text-center text-xs sm:text-sm font-medium text-slate-600/90">
                {step.label}
              </p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
