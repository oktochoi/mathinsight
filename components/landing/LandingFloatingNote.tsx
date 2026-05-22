'use client';

import { motion } from 'framer-motion';

type NoteProps = {
  label: string;
  body: string;
  tone?: 'amber' | 'blue' | 'slate';
  rotate?: number;
  className?: string;
};

export function LandingFloatingNote({
  label,
  body,
  tone = 'amber',
  rotate = -3,
  className = '',
}: NoteProps) {
  const styles = {
    amber: 'border-amber-200/70 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] text-amber-950',
    blue: 'border-blue-200/60 bg-gradient-to-br from-blue-50 to-white text-slate-800',
    slate: 'border-slate-200/80 bg-white/90 backdrop-blur-md text-slate-700',
  };

  return (
    <motion.div
      className={`rounded-lg px-3 py-2.5 shadow-lg border max-w-[200px] ${styles[tone]} ${className}`}
      style={{ rotate }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4 + Math.abs(rotate), repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.04, rotate: rotate * 0.5 }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-[11px] font-semibold mt-0.5 leading-snug">{body}</p>
    </motion.div>
  );
}
