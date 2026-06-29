'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import type { ScreenshotKey } from '@/lib/marketing/screenshots';

export function ProductShowcase({
  id,
  eyebrow,
  title,
  description,
  screenshotKey,
  reverse,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  screenshotKey: ScreenshotKey;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        'grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16',
        reverse && '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1',
        className
      )}
    >
      <FadeIn>
        <p className={mkt.eyebrow}>{eyebrow}</p>
        <h3 className={cn(mkt.h3, 'mt-3 text-xl md:text-2xl')}>{title}</h3>
        <p className={cn(mkt.body, 'mt-4 max-w-md')}>{description}</p>
      </FadeIn>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <ScreenshotPlaceholder screenshotKey={screenshotKey} />
      </motion.div>
    </div>
  );
}
