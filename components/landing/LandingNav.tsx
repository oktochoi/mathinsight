'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

const NAV = [
  { href: '#features', label: '기능' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#screens', label: '화면' },
  { href: '#pricing', label: '요금' },
  { href: '#faq', label: 'FAQ' },
];

type Props = { scrollY: number };

export function LandingNav({ scrollY }: Props) {
  const [open, setOpen] = useState(false);
  const scrolled = scrollY > 8;

  return (
    <header
      className={`ef-nav sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'ef-nav-scrolled' : ''
      }`}
    >
      <div className="ef-container ef-nav-inner">
        <Link href="/" className="ef-logo">
          <span className="ef-logo-mark" aria-hidden>
            <i className="ri-flow-chart" />
          </span>
          <span>{BRAND_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="주요">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="ef-nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth" className="ef-nav-ghost">
            로그인
          </Link>
          <Link href="/signup" className="ef-btn-primary ef-btn-sm">
            무료 체험
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden ef-icon-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="메뉴"
        >
          <i className={open ? 'ri-close-line' : 'ri-menu-3-line'} />
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 py-4 ef-container" style={{ borderTop: '1px solid var(--ef-border)', background: 'rgba(255,255,255,0.96)' }}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm last:border-0"
              style={{ color: 'var(--app-ink-2)', borderBottom: '1px solid var(--ef-border)' }}
            >
              {item.label}
            </a>
          ))}
          <div className="flex gap-2 mt-4">
            <Link href="/auth" className="ef-btn-secondary flex-1 text-center" onClick={() => setOpen(false)}>
              로그인
            </Link>
            <Link href="/signup" className="ef-btn-primary flex-1 text-center" onClick={() => setOpen(false)}>
              무료 체험
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
