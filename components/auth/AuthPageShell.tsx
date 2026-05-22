'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthPageShell({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen min-h-[100dvh] soft-mesh-bg flex items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="soft-blob w-[360px] h-[360px] -top-20 -left-20 bg-violet-300/45"
          animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="soft-blob w-[320px] h-[320px] bottom-0 right-0 bg-sky-300/40"
          animate={{ opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
      </div>

      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2.5 z-10"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200/50">
          <i className="ri-bar-chart-box-fill text-white text-base"></i>
        </div>
        <span className="text-indigo-950 text-lg font-bold tracking-tight">MathInsight</span>
      </Link>

      <Link
        href="/"
        className="absolute top-6 right-6 sm:top-8 sm:right-8 text-sm text-slate-500 hover:text-indigo-600 z-10 transition-colors"
      >
        홈으로
      </Link>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-950 mb-2 text-center tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-600/90 text-sm text-center mb-8 leading-relaxed">{subtitle}</p>
        )}

        <div className="soft-card rounded-[1.75rem] p-6 sm:p-8 !transform-none hover:!transform-none shadow-xl shadow-indigo-100/30">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
