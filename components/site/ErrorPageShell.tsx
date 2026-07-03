import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { CONTACT_EMAIL } from '@/lib/brand';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type ErrorPageShellProps = {
  statusCode: 404 | 500;
  title: string;
  description: string;
  showLogin?: boolean;
};

export function ErrorPageShell({
  statusCode,
  title,
  description,
  showLogin = true,
}: ErrorPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="w-full max-w-lg">
        <BrandLogo href={MARKETING_ROUTES.home} className={cn('justify-center')} />

        <p className="mt-10 text-7xl font-extrabold tracking-tight text-sky-600">{statusCode}</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={MARKETING_ROUTES.home}
            className="inline-flex items-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            홈으로
          </Link>
          <Link
            href={MARKETING_ROUTES.contact}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
          >
            문의하기
          </Link>
          {showLogin && (
            <Link
              href={MARKETING_ROUTES.auth}
              className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:text-sky-700"
            >
              로그인
            </Link>
          )}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          도움이 필요하시면{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
          로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
