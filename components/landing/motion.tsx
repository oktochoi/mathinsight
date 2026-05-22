'use client';

import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;
const bounce = [0.34, 1.56, 0.64, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.55, ease },
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
  as?: 'div' | 'section';
};

export function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.2,
  as = 'div',
}: RevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const Tag = motion[as];

  return (
    <Tag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease, delay },
        },
      }}
    >
      {children}
    </Tag>
  );
}

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease, delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FloatY({
  children,
  className,
  range = 10,
  duration = 5,
}: {
  children: ReactNode;
  className?: string;
  range?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -range, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

/** hover 시 살짝 떠오르는 카드 래퍼 */
export function HoverLift({
  children,
  className,
  lift = 8,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

/** 스크롤 패럴랙스 */
export function SoftParallax({
  children,
  className,
  offset = 40,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset * 0.5, -offset * 0.5]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** 버튼/칩 hover bounce */
export function HoverBounce({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}
