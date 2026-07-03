'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { SCREENSHOTS, type ScreenshotKey } from '@/lib/marketing/screenshots';
import {
  MarketingScreenMockup,
  type MarketingScreenVariant,
} from '@/components/marketing/ui/MarketingScreenMockup';

const MOCKUP_VARIANT: Partial<Record<ScreenshotKey, MarketingScreenVariant>> = {
  dashboard: 'dashboard',
  'today-lesson': 'today-lesson',
  'student-hub': 'student-hub',
  'parent-report': 'parent-report',
  billing: 'billing',
};

/* ─── 공개 컴포넌트 ───────────────────────────────────────────── */
type Props = {
  screenshotKey?: ScreenshotKey;
  label?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function ScreenshotPlaceholder({
  screenshotKey,
  label,
  src,
  alt,
  width,
  height,
  className,
  priority,
}: Props) {
  const spec = screenshotKey ? SCREENSHOTS[screenshotKey] : undefined;
  const resolvedSrc = src ?? spec?.src;
  const w = width ?? spec?.width ?? 1280;
  const h = height ?? spec?.height ?? 720;

  if (resolvedSrc) {
    return (
      <div
        className={cn('relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100', className)}
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <Image
          src={resolvedSrc}
          alt={alt ?? label ?? 'Product screenshot'}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
      </div>
    );
  }

  const variant = screenshotKey ? MOCKUP_VARIANT[screenshotKey] : undefined;
  if (variant) {
    return <MarketingScreenMockup variant={variant} className={className} />;
  }

  return <MarketingScreenMockup variant="dashboard" className={className} />;
}
