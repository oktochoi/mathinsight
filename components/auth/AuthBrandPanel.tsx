'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { BRAND_NAME } from '@/lib/brand';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { mkt } from '@/lib/marketing/ui';

const PREVIEWS = [
  {
    title: 'AI Student Summary',
    desc: '3주간 80→68 · 숙제 미제출 2회',
    tone: 'ai' as const,
    delay: 0,
  },
  {
    title: 'Risk Snapshot',
    desc: '위험도 72 · 숙제·성적 복합',
    tone: 'risk' as const,
    delay: 0.15,
  },
  {
    title: 'Counseling Card',
    desc: '학부모: 루틴 공유 · 학생: 오답노트',
    tone: 'ai' as const,
    delay: 0.3,
  },
];

export function AuthMobileLogo() {
  return (
    <Link href="/" className={`${mkt.logo} mb-8 lg:hidden`}>
      <span className={mkt.logoMark} aria-hidden>
        <i className="ri-flow-chart" />
      </span>
      <span className={mkt.logoText}>{BRAND_NAME}</span>
    </Link>
  );
}

export function AuthBrandPanel({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-600 via-blue-700 to-slate-800 px-10 py-12 text-white ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-lg backdrop-blur-sm">
            <i className="ri-flow-chart" aria-hidden />
          </span>
          <span className="text-xl font-extrabold tracking-tight">{BRAND_NAME}</span>
        </Link>
      </div>

      <div className="relative z-10 my-10 max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl font-extrabold leading-snug tracking-tight md:text-3xl"
        >
          학생 기록이
          <br />
          상담 준비가 됩니다.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-sm leading-relaxed text-white/85 md:text-[15px]"
        >
          수업기록, AI 학생 분석, 상담 준비, 학부모 리포트, 재등록 관리를 하나의 흐름으로 연결합니다.
        </motion.p>
      </div>

      <div className="relative z-10 space-y-3">
        {PREVIEWS.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + card.delay }}
            className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4 + card.delay * 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {card.tone === 'risk' ? 'Risk' : 'AI'}
              </p>
              <p className="mt-1 text-sm font-bold">{card.title}</p>
              <p className="mt-1 text-xs text-white/75">{card.desc}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <p className="relative z-10 mt-8 text-xs text-white/50">
        <Link href={AUTH_ROUTES.demo} className="underline underline-offset-2 hover:text-white/80">
          Demo Academy
        </Link>
        로 먼저 체험할 수 있습니다.
      </p>
    </aside>
  );
}
