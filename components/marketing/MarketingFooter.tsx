import Link from 'next/link';
import { BRAND_NAME, COMPANY_DOMAIN, COMPANY_LEGAL_NAME, CONTACT_EMAIL, SITE_URL } from '@/lib/brand';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { FOOTER_COLUMNS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

const BAR_LINKS = [
  { href: MARKETING_ROUTES.about, label: '회사소개' },
  { href: MARKETING_ROUTES.terms, label: '이용약관' },
  { href: MARKETING_ROUTES.privacy, label: '개인정보처리방침' },
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
            <BrandLogo href={MARKETING_ROUTES.home} />
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
            <strong className="text-slate-700">{COMPANY_LEGAL_NAME}</strong>
          </p>
          <p>
            <a href={SITE_URL} className="text-slate-600 hover:text-sky-700">
              {COMPANY_DOMAIN}
            </a>
            {' · '}
            파일럿 운영 중
          </p>
          <p className="mt-1">
            문의 메일:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-700 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
