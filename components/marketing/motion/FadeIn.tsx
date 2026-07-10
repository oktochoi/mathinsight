'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';
import { EASE, DURATION } from '@/lib/motion';

type Props = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
};

export function FadeIn({ children, className, delay = 0, y = 16, ...rest }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: DURATION.base, delay, ease: EASE }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
