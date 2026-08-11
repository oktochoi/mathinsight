'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signUpWithEmail } from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { AuthField, AuthInput, AuthPasswordInput, AuthSubmitButton } from '@/components/auth/AuthField';

export function EmailOwnerSignupForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (!email.trim().includes('@')) {
      setError('올바른 이메일을 입력해 주세요.');
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
        role: 'owner',
      });
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      if (needsEmailConfirmation || !hasSession) {
        toast.success('가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.');
        router.replace(
          `${AUTH_ROUTES.login}?registered=1&confirm=1&email=${encodeURIComponent(email.trim())}`
        );
        return;
      }
      toast.success('가입이 완료되었습니다. 학원 프로필을 설정해 주세요.');
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="auth-error-banner">{error}</div>}
      <AuthField label="이름">
        <AuthInput
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          autoComplete="name"
        />
      </AuthField>
      <AuthField label="이메일">
        <AuthInput
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@academy.kr"
          autoComplete="email"
        />
      </AuthField>
      <AuthField label="비밀번호">
        <AuthPasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상"
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
        />
      </AuthField>
      <AuthField label="비밀번호 확인">
        <AuthInput
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호 재입력"
          autoComplete="new-password"
        />
      </AuthField>
      <label className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--auth-muted)' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 rounded"
        />
        <span>
          <Link href="/terms" className="auth-link">
            이용약관
          </Link>
          과{' '}
          <Link href="/privacy" className="auth-link">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </span>
      </label>
      <AuthSubmitButton loading={loading}>
        {loading ? '가입 중...' : '학원 개설 시작'}
      </AuthSubmitButton>
      <p className="text-[11px] text-center" style={{ color: 'var(--auth-muted)' }}>
        가입 후 학원 프로필 설정을 진행합니다. 이메일이 로그인 아이디입니다.
      </p>
    </form>
  );

  if (embedded) return form;
  return form;
}
