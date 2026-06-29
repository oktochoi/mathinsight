'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/cn';

export function MobileCarousel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [emblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });

  return (
    <div ref={emblaRef} className={cn('overflow-hidden md:hidden', className)}>
      <div className="flex gap-4">{children}</div>
    </div>
  );
}

export function CarouselSlide({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('min-w-[85%] shrink-0', className)}>{children}</div>;
}
