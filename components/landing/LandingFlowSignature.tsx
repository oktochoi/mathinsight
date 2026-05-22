'use client';

import { useRef, type RefObject } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

type Props = {
  curve?: string;
  className?: string;
  heightClass?: string;
  scrollRef?: RefObject<HTMLElement | null>;
  subtle?: boolean;
};

export function LandingFlowSignature({
  curve = 'M 16 108 C 90 4, 220 112, 360 44 S 600 0, 784 48',
  className = '',
  heightClass = 'h-16 sm:h-20',
  scrollRef,
  subtle = false,
}: Props) {
  const pathRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(pathRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({
    target: scrollRef ?? wrapRef,
    offset: ['start end', 'end start'],
  });
  const dotX = useTransform(scrollYProgress, [0.1, 0.5], ['0%', '100%']);

  const strokeW = subtle ? 2 : 4;
  const showParticles = !subtle;

  return (
    <div ref={wrapRef} className={`relative w-full ${heightClass} ${className}`}>
      <svg
        ref={pathRef}
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 800 128"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="sig-flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c4bcb2" stopOpacity={subtle ? 0.15 : 0.25} />
            <stop offset="50%" stopColor="#4a6fa5" stopOpacity={subtle ? 0.5 : 0.9} />
            <stop offset="100%" stopColor="#c4bcb2" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <path
          d={curve}
          stroke="rgba(26,24,22,0.05)"
          strokeWidth={strokeW + 4}
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d={curve}
          stroke="url(#sig-flow-grad)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={inView ? { pathLength: 1, opacity: subtle ? 0.65 : 1 } : {}}
          transition={{ duration: subtle ? 2.5 : 2, ease: [0.22, 1, 0.36, 1] }}
        />
        {!subtle && (
          <motion.path
            d={curve}
            stroke="#4a6fa5"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="8 20"
            strokeOpacity={0.35}
            animate={inView ? { opacity: [0.1, 0.4, 0.1] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
        )}
      </svg>
      {showParticles &&
        [0.25, 0.5, 0.75].map((t, i) => (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#4a6fa5]/50"
            style={{ left: `${t * 100}%`, top: '45%' }}
            animate={inView ? { opacity: [0.2, 0.8, 0.2] } : {}}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      {inView && (
        <motion.span
          className="absolute top-[42%] w-3 h-3 rounded-full bg-[#2563eb] -translate-x-1/2 pointer-events-none"
          style={{
            left: dotX,
            opacity: subtle ? 0.7 : 1,
            boxShadow: subtle
              ? '0 0 16px rgba(37,99,235,0.45)'
              : '0 0 28px rgba(37,99,235,0.65)',
          }}
        />
      )}
    </div>
  );
}
