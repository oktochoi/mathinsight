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
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthRoleTabs,
  authAudienceHint,
  authLoginPlaceholder,
  type AuthAudience,
} from '@/components/auth/AuthRoleTabs';
import {
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthLoginFooter } from '@/components/auth/AuthFooter';

function audienceFromParam(value: string | null): AuthAudience {
  if (value === 'parent' || value === 'student' || value === 'staff') return value;
  return 'staff';
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [audience, setAudience] = useState<AuthAudience>(() =>
    audienceFromParam(searchParams.get('as'))
  );
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
    const as = searchParams.get('as');
    if (as === 'parent') setAudience('parent');
    if (as === 'student') {
      router.replace('/login/student');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (audience === 'student') {
      router.replace('/login/student');
    }
  }, [audience, router]);

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

  return (
    <AuthPageScaffold>
      <AuthFormCard title="로그인" subtitle="EduFlow에 다시 오신 것을 환영해요">
        <div className="mb-5">
          <AuthRoleTabs value={audience} onChange={setAudience} />
          <p className="mt-2 text-[11px] text-center" style={{ color: 'var(--auth-muted)' }}>
            {authAudienceHint(audience)}
          </p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <GoogleSignInButton disabled={loading} />
        <p className="text-[11px] text-center -mt-2 mb-1" style={{ color: 'var(--auth-muted)' }}>
          Google 로그인 후 휴대폰 인증이 필요할 수 있습니다.
        </p>
        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="휴대폰 번호">
            <AuthInput
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={authLoginPlaceholder(audience)}
              inputMode="numeric"
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
          {audience === 'staff' && (
            <div className="flex justify-end">
              <Link href={AUTH_ROUTES.forgotPassword} className="auth-link text-xs">
                비밀번호 찾기
              </Link>
            </div>
          )}
          <AuthSubmitButton loading={loading}>{loading ? '로그인 중...' : '로그인'}</AuthSubmitButton>
        </form>

        {audience !== 'staff' && (
          <p className="mt-3 text-[11px] text-center" style={{ color: 'var(--auth-muted)' }}>
            계정은 학원 초대로만 만들 수 있습니다. 초대 메일을 확인하거나 학원에 문의해 주세요.
          </p>
        )}

        <p className="mt-3 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          학생이신가요?{' '}
          <Link href="/login/student" className="auth-link">
            학생 로그인
          </Link>
        </p>

        {audience === 'staff' && <AuthLoginFooter />}
      </AuthFormCard>
    </AuthPageScaffold>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="로그인" subtitle="불러오는 중...">
            <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
              잠시만 기다려 주세요
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
