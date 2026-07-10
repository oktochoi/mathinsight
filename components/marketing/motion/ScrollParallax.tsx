'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/cn';

/** 스크롤에 따라 미세하게 위아래로 움직이는 패럴랙스 래퍼 — 히어로 목업처럼 "살아있지만 차분한" 느낌이 필요할 때 사용 */
export function ScrollParallax({
  children,
  className,
  range = 20,
}: {
  children: React.ReactNode;
  className?: string;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <motion.div ref={ref} style={{ y, willChange: 'transform' }} className={cn(className)}>
      {children}
    </motion.div>
  );
}
