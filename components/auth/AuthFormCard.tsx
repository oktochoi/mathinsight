'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function AuthFormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-7 shadow-xl shadow-slate-900/5 backdrop-blur-sm md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </motion.div>
  );
}
