'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND_NAME, BRAND_TAGLINE_SHORT } from '@/lib/brand';

const NAV_LINKS = [
  { href: '#features', label: '기능' },
  { href: '#flow', label: '흐름' },
  { href: '#scene', label: '화면' },
];

type Props = { scrollY: number };

export function LandingNav({ scrollY }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = scrollY > 16;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-indigo-100/60 shadow-sm shadow-indigo-100/25'
            : 'bg-transparent'
        }`}
      >
        <div className="h-16 max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <span className="soft-nav-mark shrink-0" aria-hidden>
              <i className="ri-flow-chart text-lg" />
            </span>
            <span className="min-w-0">
              <span className="block text-base sm:text-lg font-bold text-indigo-950 tracking-tight group-hover:text-indigo-700 transition-colors truncate">
                {BRAND_NAME}
              </span>
              <span className="hidden sm:block text-[10px] text-indigo-400/90 font-medium tracking-wide truncate">
                {BRAND_TAGLINE_SHORT}
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600/90 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/auth"
              className="text-sm text-slate-600/90 hover:text-indigo-600 transition-colors"
            >
              로그인
            </Link>
            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link href="/signup" className="soft-btn-primary !py-2.5 !px-4 !text-sm">
                시작하기
              </Link>
            </motion.div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/auth"
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-2 py-1.5"
            >
              로그인
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-xl border border-indigo-100/80 bg-white/70 backdrop-blur-sm flex items-center justify-center text-indigo-700"
              aria-expanded={menuOpen}
              aria-label="메뉴"
            >
              <i className={menuOpen ? 'ri-close-line text-xl' : 'ri-menu-3-line text-xl'} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-indigo-50/80 bg-white/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 soft-btn-primary w-full text-center"
                >
                  시작하기
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4 pt-2 pointer-events-none">
        <div className="pointer-events-auto soft-mobile-cta-bar flex items-center gap-2 p-2 max-w-md mx-auto">
          <Link
            href="/auth"
            className="flex-1 text-center text-sm font-semibold text-indigo-700 py-3 rounded-xl hover:bg-indigo-50/60 transition-colors"
          >
            로그인
          </Link>
          <Link href="/signup" className="flex-[1.4] soft-btn-primary !py-3 w-full text-center !rounded-xl">
            시작하기
          </Link>
        </div>
      </div>
    </>
  );
}
