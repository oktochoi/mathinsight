'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingCanvas } from '@/components/landing/LandingCanvas';
import { LandingEditorialHero } from '@/components/landing/LandingEditorialHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingEditorialScene } from '@/components/landing/LandingEditorialScene';
import { LandingProcessFlow } from '@/components/landing/LandingProcessFlow';
import { LandingEditorialCta } from '@/components/landing/LandingEditorialCta';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <LandingCanvas>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-8 lg:px-12 transition-all duration-500 ${
          scrollY > 16
            ? 'bg-white/70 backdrop-blur-xl border-b border-indigo-100/50 shadow-sm shadow-indigo-100/20'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="text-lg font-bold text-indigo-950 tracking-tight hover:text-indigo-700 transition-colors"
          >
            MathInsight
          </Link>
          <span className="hidden sm:inline text-[10px] text-indigo-400/90 font-medium tracking-wide">
            학생 기록의 흐름
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-7">
          <a
            href="#features"
            className="text-sm text-slate-600/90 hover:text-indigo-600 hidden sm:block transition-colors"
          >
            기능
          </a>
          <a
            href="#flow"
            className="text-sm text-slate-600/90 hover:text-indigo-600 hidden sm:block transition-colors"
          >
            흐름
          </a>
          <a
            href="#scene"
            className="text-sm text-slate-600/90 hover:text-indigo-600 hidden md:block transition-colors"
          >
            문의
          </a>
          <Link
            href="/login"
            className="text-sm text-slate-600/90 hover:text-indigo-600 transition-colors"
          >
            로그인
          </Link>
          <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-600 shadow-md shadow-indigo-300/40 hover:shadow-lg hover:shadow-indigo-300/50 transition-shadow"
            >
              무료로 시작하기
            </Link>
          </motion.div>
        </div>
      </nav>

      <LandingEditorialHero />
      <LandingFeatures />
      <LandingEditorialScene />
      <LandingProcessFlow />
      <LandingEditorialCta />

      <footer className="py-10 px-4 sm:px-8 border-t border-indigo-100/40 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-xs text-slate-500/90">
          <span className="font-semibold text-indigo-950">MathInsight</span>
          <span className="soft-body text-[11px]">흐름이 남는 학생 기록</span>
        </div>
      </footer>
    </LandingCanvas>
  );
}
