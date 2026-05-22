'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/** 브랜드 시그니처 — 학생 흐름을 잇는 곡선 */
export function BrandFlowLineVertical({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const pathD = 'M6 0 C6 40 2 70 6 100 S10 150 6 200';

  return (
    <svg
      ref={ref}
      className={className}
      width="12"
      height="100%"
      viewBox="0 0 12 200"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="flow-v" x1="6" y1="0" x2="6" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a5f" stopOpacity="0.15" />
          <stop offset="0.35" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#1e3a5f" stopOpacity="0.4" />
          <stop offset="1" stopColor="#d97706" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path d={pathD} stroke="rgba(148,163,184,0.25)" strokeWidth="2" strokeLinecap="round" />
      {animate ? (
        <motion.path
          d={pathD}
          stroke="url(#flow-v)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : (
        <path d={pathD} stroke="url(#flow-v)" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function BrandFlowLineHorizontal({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="flow-h" x1="0" y1="6" x2="400" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a5f" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#1e3a5f" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M0 6 C80 6 120 2 200 6 S320 10 400 6"
        stroke="url(#flow-h)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
