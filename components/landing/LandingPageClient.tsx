'use client';

import { useState, useEffect } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';

/** 스크롤 연동 네비만 클라이언트 — 본문은 서버 렌더 */
export function LandingNavClient() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <LandingNav scrollY={scrollY} />;
}
