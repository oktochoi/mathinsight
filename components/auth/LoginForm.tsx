'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  fetchUserProfile,
  oauthLoginErrorMessage,
  signInWithLoginId,
} from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { fetchPostAuthDestination } from '@/lib/workspace/postAuthClient';
import { CONTACT_EMAIL } from '@/lib/brand';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthErr = oauthLoginErrorMessage(searchParams.get('error'));
    if (oauthErr) {
      setError(oauthErr);
      toast.error(oauthErr);
    }
    if (searchParams.get('registered') === '1') {
      const mail = searchParams.get('email');
      if (mail) setLoginId(mail);
      const msg =
        searchParams.get('confirm') === '1'
          ? '가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.'
          : '가입이 완료되었습니다. 로그인해 주세요.';
      toast.success(msg);
    }
    if (searchParams.get('reset') === '1') {
      toast.success('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err, profile, user, needsChooseRole, rawDbRole } = await signInWithLoginId(
        loginId,
        password
      );
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      if (!user) {
        const msg = '로그인에 실패했습니다.';
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success('로그인되었습니다.');
      if (needsChooseRole) {
        router.replace(AUTH_ROUTES.chooseRole);
        return;
      }
      const fresh = (await fetchUserProfile(user.id)) ?? profile;
      const dest = await fetchPostAuthDestination(
        searchParams.get('next'),
        rawDbRole ?? fresh?.role ?? null
      );
      router.replace(dest);
    } finally {
      setLoading(false);
    }
  };

  const subject = encodeURIComponent('EduFlow 도입 문의');
  const body = encodeURIComponent(
    '안녕하세요.\n\n학원명:\n학생 수:\n문의 내용:\n'
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <AuthPageScaffold>
      <AuthFormCard title="로그인" subtitle="EduFlow 계정으로 로그인하세요">
        {PROMO_ALL_FREE.active && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center">
            <p className="text-xs font-medium text-green-700">
              지금 도입하시면 행사 기간 중 전 기능 무료
            </p>
          </div>
        )}

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="이메일">
            <AuthInput
              required
              type="email"
              autoComplete="email"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="you@academy.kr"
            />
          </AuthField>
          <AuthField label="비밀번호">
            <AuthPasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </AuthField>
          <div className="flex justify-end">
            <Link href={AUTH_ROUTES.forgotPassword} className="auth-link text-xs">
              비밀번호 찾기
            </Link>
          </div>
          <AuthSubmitButton loading={loading}>{loading ? '로그인 중...' : '로그인'}</AuthSubmitButton>
        </form>

        <hr className="my-5 border-slate-100" />

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">
            아직 계정이 없으신가요?
          </p>
          <a
            href={mailto}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <i className="ri-mail-send-line" />
            도입 문의하기
          </a>
          <p className="mt-2 text-[11px] text-slate-400">
            {CONTACT_EMAIL}으로 메일을 보내주시면 안내드리겠습니다
          </p>
        </div>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="로그인" subtitle="잠시만 기다려 주세요">
            <p className="py-8 text-center text-sm text-slate-400">
              불러오는 중...
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
