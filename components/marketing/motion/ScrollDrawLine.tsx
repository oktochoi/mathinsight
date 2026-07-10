'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/cn';

/** 스크롤에 따라 왼쪽에서 오른쪽으로 "그려지는" 연결선 — 단계가 나열이 아니라 하나의 흐름임을 보여줄 때 사용 (예: Workflow) */
export function ScrollDrawLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'start 20%'] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={cn('absolute top-7 left-0 right-0 hidden h-px md:block', className)}>
      <div className="absolute inset-0 bg-slate-200/70" />
      <motion.div
        style={{ scaleX, transformOrigin: 'left', willChange: 'transform' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
      />
    </div>
  );
}
