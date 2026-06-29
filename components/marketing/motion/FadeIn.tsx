'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

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
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
