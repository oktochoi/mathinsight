'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function LandingCanvas({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`landing-canvas soft-mesh-bg relative min-h-screen overflow-x-hidden text-slate-900 ${className}`}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <motion.div
          className="soft-blob w-[420px] h-[420px] -top-24 -left-24 bg-violet-300/50 soft-glow-drift"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="soft-blob w-[380px] h-[380px] top-[30%] -right-32 bg-sky-300/45"
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="soft-blob w-[300px] h-[300px] bottom-0 left-[35%] bg-amber-200/40"
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
