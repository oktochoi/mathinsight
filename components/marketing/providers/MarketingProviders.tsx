'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { Toaster } from 'sonner';

export function MarketingProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {children}
      <Toaster position="bottom-center" toastOptions={{ className: 'text-sm' }} />
    </>
  );
}
