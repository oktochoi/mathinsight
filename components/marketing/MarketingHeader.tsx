'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { HEADER_NAV, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm shadow-slate-900/5">
      <div className={cn(mkt.container, 'flex h-[72px] items-center gap-4')}>
        <BrandLogo href={MARKETING_ROUTES.home} priority size={56} />

        <nav className="hidden flex-1 justify-end items-center gap-1 lg:flex" aria-label="주요">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3.5 py-2 text-[15px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-teal-700',
                pathname === item.href && 'bg-emerald-50 text-teal-700'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={MARKETING_ROUTES.signup}
            className={cn(mkt.btnGreenSm, 'ml-2 shadow-lg shadow-green-600/30')}
          >
            무료 체험
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link href={MARKETING_ROUTES.signup} className={cn(mkt.btnGreenSm, 'shadow-lg shadow-green-600/30')}>
            무료 체험
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-600"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="메뉴"
          >
            <i className={open ? 'ri-close-line' : 'ri-menu-3-line'} />
          </button>
        </div>
      </div>

      {open && (
        <div className={cn(mkt.container, 'border-t border-slate-100 pb-4 lg:hidden')}>
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-slate-50 py-3 text-sm text-slate-700"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={MARKETING_ROUTES.signup}
            onClick={() => setOpen(false)}
            className={cn(mkt.btnGreen, 'mt-3 w-full text-center')}
          >
            무료 체험
          </Link>
          <Link
            href={MARKETING_ROUTES.auth}
            onClick={() => setOpen(false)}
            className="mt-2 block text-center text-sm text-slate-500 py-2"
          >
            로그인
          </Link>
        </div>
      )}
    </header>
  );
}
