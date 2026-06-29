import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { FOOTER_COLUMNS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

const BAR_LINKS = [
  { href: MARKETING_ROUTES.about, label: '회사소개' },
  { href: MARKETING_ROUTES.privacy, label: '개인정보 처리방침' },
  { href: MARKETING_ROUTES.contact, label: '도입 문의' },
  { href: MARKETING_ROUTES.security, label: '정보보호' },
];

export function MarketingFooter() {
  return (
    <footer>
      <div className="bg-slate-600 py-3.5">
        <div className={mkt.container}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/90">
            {BAR_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-10">
        <div className={cn(mkt.container, 'grid gap-8 md:grid-cols-[1.2fr_repeat(4,1fr)]')}>
          <div>
            <Link href={MARKETING_ROUTES.home} className={mkt.logo}>
              <span className={mkt.logoMark} aria-hidden>
                <i className="ri-flow-chart" />
              </span>
              <span className={mkt.logoText}>{BRAND_NAME}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              AI 상담 운영 시스템 — 학생 기록이 상담 준비가 되는 학원 운영 플랫폼
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {col.title}
              </p>
              <ul className="space-y-1">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-sky-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn(mkt.container, 'mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500')}>
          <p>
            <strong className="text-slate-700">(주)에듀플로우</strong>
          </p>
          <p>hello@eduflow.app · 파일럿 운영 중</p>
          <p className="mt-2 text-xs text-slate-400">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
