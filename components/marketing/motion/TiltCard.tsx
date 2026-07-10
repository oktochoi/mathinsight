'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/cn';

/** 마우스 위치에 반응해 살짝 기울어지는 카드 래퍼 — "손끝으로 만지는" 느낌이 필요한 목업·카드에 사용 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { damping: 20, stiffness: 200 });
  const rotateY = useSpring(rotateYRaw, { damping: 20, stiffness: 200 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * max);
    rotateXRaw.set(-py * max);
  }

  function onMouseLeave() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, willChange: 'transform' }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
