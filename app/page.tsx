'use client';

import { useState, useEffect } from 'react';
import { LandingCanvas } from '@/components/landing/LandingCanvas';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingEditorialHero } from '@/components/landing/LandingEditorialHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingEditorialScene } from '@/components/landing/LandingEditorialScene';
import { LandingProcessFlow } from '@/components/landing/LandingProcessFlow';
import { LandingEditorialCta } from '@/components/landing/LandingEditorialCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <LandingCanvas className="pb-20 md:pb-0">
      <LandingNav scrollY={scrollY} />

      <LandingEditorialHero />
      <LandingFeatures />
      <LandingEditorialScene />
      <LandingProcessFlow />
      <LandingEditorialCta />

      <LandingFooter />
    </LandingCanvas>
  );
}
