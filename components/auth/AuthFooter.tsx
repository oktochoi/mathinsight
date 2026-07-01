'use client';

import Link from 'next/link';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import type { AuthAudience } from '@/components/auth/AuthRoleTabs';

export function AuthFooter({
  prompt,
  href,
  linkLabel,
  secondaryHref,
  secondaryLabel,
}: {
  prompt: string;
  href: string;
  linkLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mt-6 space-y-3 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
      <p>
        {prompt}{' '}
        <Link href={href} className="auth-link">
          {linkLabel}
        </Link>
      </p>
      {secondaryHref && secondaryLabel && (
        <Link href={secondaryHref} className="auth-btn-ghost">
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}

export function AuthLoginFooter() {
  return (
    <AuthFooter
      prompt="계정이 없으신가요?"
      href={AUTH_ROUTES.signup}
      linkLabel="회원가입"
      secondaryHref={AUTH_ROUTES.demo}
      secondaryLabel="데모 체험하기"
    />
  );
}

export function AuthSignupFooter({ audience }: { audience?: AuthAudience }) {
  const loginHref = audience ? `${AUTH_ROUTES.login}?as=${audience}` : AUTH_ROUTES.login;
  return (
    <AuthFooter
      prompt="이미 계정이 있으신가요?"
      href={loginHref}
      linkLabel="로그인"
    />
  );
}
