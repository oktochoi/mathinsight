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
      <div className="auth-card p-7 md:p-8">
        <div className="mb-6">
          <h1 className="auth-card-title">{title}</h1>
          {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </motion.div>
  );
}
