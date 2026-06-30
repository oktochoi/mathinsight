'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  fetchUserProfile,
  oauthLoginErrorMessage,
  resolvePostLoginPath,
  signInWithLoginId,
} from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { mkt } from '@/lib/marketing/ui';

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
      const dest = resolvePostLoginPath(user, fresh, searchParams.get('next'), rawDbRole);
      router.replace(dest);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthMobileLogo />
      <AuthFormCard title="로그인" subtitle="EduFlow에 다시 오신 것을 환영해요">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <GoogleSignInButton disabled={loading} />
        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="아이디">
            <AuthInput
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="휴대폰 번호 또는 이메일"
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
            <Link href={AUTH_ROUTES.forgotPassword} className="text-xs font-semibold text-sky-700 hover:underline">
              비밀번호 찾기
            </Link>
          </div>
          <AuthSubmitButton loading={loading}>{loading ? '로그인 중...' : '로그인'}</AuthSubmitButton>
        </form>

        <p className="mt-3 text-[11px] text-slate-500 text-center">
          학생·학부모는 가입한 휴대폰 번호, 원장·강사는 이메일로 로그인합니다.
        </p>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-slate-600">
            계정이 없으신가요?{' '}
            <Link href={AUTH_ROUTES.signup} className={mkt.link}>
              회원가입
            </Link>
          </p>
          <Link
            href={AUTH_ROUTES.demo}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            데모 체험하기
          </Link>
        </div>
      </AuthFormCard>
    </>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <AuthFormCard title="로그인" subtitle="불러오는 중...">
          <p className="py-8 text-center text-sm text-slate-500">잠시만 기다려 주세요</p>
        </AuthFormCard>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
