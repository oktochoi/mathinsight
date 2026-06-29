'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { SCREENSHOTS, type ScreenshotKey } from '@/lib/marketing/screenshots';

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
  const resolvedLabel = label ?? spec?.label ?? 'Product Screenshot';
  const resolvedSrc = src ?? spec?.src;
  const w = width ?? spec?.width ?? 1280;
  const h = height ?? spec?.height ?? 720;
  const resolvedAlt = alt ?? `${resolvedLabel} screenshot`;

  if (resolvedSrc) {
    return (
      <div
        className={cn('relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100', className)}
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <Image
          src={resolvedSrc}
          alt={resolvedAlt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-sky-200 bg-sky-50/50',
        className
      )}
      style={{ aspectRatio: `${w} / ${h}` }}
      aria-label={`${resolvedLabel} — 이미지 준비 중`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(0,0,0,0.02)_50%,transparent_60%)]" />
      <div className="relative z-10 px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">Screenshot</p>
        <p className="mt-2 text-sm font-medium text-zinc-700">{resolvedLabel}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {w} × {h}
        </p>
        <p className="mt-4 text-xs text-zinc-400">실제 이미지 예정</p>
      </div>
    </div>
  );
}
