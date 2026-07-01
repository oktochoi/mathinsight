'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { signUpWithEmail } from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import type { SignupRole } from '@/lib/roles';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { RolePicker } from '@/components/auth/RolePicker';
import { AuthSignupFooter } from '@/components/auth/AuthFooter';
import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';
import { peekPendingAcademyCode } from '@/lib/academyCodeStorage';

function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<SignupRole>('owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pendingAcademyCode = peekPendingAcademyCode();

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'teacher' || r === 'owner' || r === 'parent' || r === 'student') {
      setRole(r);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('이름과 이메일을 입력해 주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreed) {
      setError('약관에 동의해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: err, hasSession, needsEmailConfirmation } = await signUpWithEmail({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      });
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      if (needsEmailConfirmation && !hasSession) {
        toast.success('인증 메일을 보냈습니다. 메일 확인 후 로그인해 주세요.');
        router.replace(
          `${AUTH_ROUTES.login}?registered=1&confirm=1&email=${encodeURIComponent(email)}`
        );
        return;
      }
      if (hasSession) {
        toast.success('가입이 완료되었습니다. 프로필을 설정해 주세요.');
        router.replace('/onboarding');
        return;
      }
      toast.success('가입이 완료되었습니다.');
      router.replace(`${AUTH_ROUTES.login}?registered=1&email=${encodeURIComponent(email)}`);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<SignupRole, string> = {
    owner: '원장 (학원 운영)',
    teacher: '강사',
    parent: '학부모',
    student: '학생',
  };

  return (
    <AuthPageScaffold>
      <AuthFormCard title="회원가입" subtitle="역할을 선택하고 계정을 만들어 주세요">
        {error && <div className="auth-error-banner">{error}</div>}

        {role === 'parent' || role === 'student' ? null : role === 'owner' ? null : (
          <>
            <GoogleSignInButton disabled={loading} label="Google로 가입하기" />
            <AuthDivider />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="역할 선택">
            <RolePicker value={role} onChange={setRole} />
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--auth-muted)' }}>
              선택: <span className="font-semibold" style={{ color: 'var(--auth-ink)' }}>{roleLabels[role]}</span>
              {role === 'teacher' && ' · 가입 후 학원 초대 코드로 연결합니다'}
            </p>
            {role === 'teacher' && pendingAcademyCode && (
              <p className="auth-info-banner mt-2 text-xs">
                학원 코드 <strong className="font-mono">{pendingAcademyCode}</strong>가 저장되어 있습니다.
                온보딩에서 자동으로 입력됩니다.
              </p>
            )}
          </AuthField>

          {role === 'parent' || role === 'student' ? (
            <div className="space-y-3">
              <p className="text-sm auth-info-banner">
                휴대폰 인증으로 가입합니다. 학원 연결은 로그인 후 포털에서 진행합니다.
              </p>
              <PhoneSignupWizard mode={role} embedded />
            </div>
          ) : role === 'owner' ? (
            <div className="space-y-3">
              <p className="text-sm auth-info-banner">
                휴대폰 인증으로 가입합니다. 가입 후 학원 프로필을 설정합니다.
              </p>
              <PhoneSignupWizard mode="owner" embedded />
            </div>
          ) : (
            <>
              <AuthField label="이름">
                <AuthInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                />
              </AuthField>
              <AuthField label="이메일">
                <AuthInput
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </AuthField>
              <AuthField label="비밀번호">
                <AuthPasswordInput
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </AuthField>
              <AuthField label="비밀번호 확인">
                <AuthInput
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </AuthField>

              <label className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--auth-muted)' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded"
                  style={{ borderColor: 'var(--auth-border)' }}
                />
                <span>
                  <Link href="/terms" className="auth-link">이용약관</Link>과{' '}
                  <Link href="/privacy" className="auth-link">개인정보처리방침</Link>에 동의합니다.
                </span>
              </label>

              <AuthSubmitButton loading={loading}>
                {loading ? '가입 처리 중...' : '회원가입'}
              </AuthSubmitButton>
            </>
          )}
        </form>

        <AuthSignupFooter />
      </AuthFormCard>
    </AuthPageScaffold>
  );
}

export function SignupForm() {
  return (
    <SignupFormInner />
  );
}
