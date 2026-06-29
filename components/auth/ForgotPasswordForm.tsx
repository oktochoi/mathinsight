'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField, AuthInput, AuthSubmitButton } from '@/components/auth/AuthField';
import { mkt } from '@/lib/marketing/ui';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await sendPasswordResetEmail(email.trim());
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      setSent(true);
      toast.success('비밀번호 재설정 메일을 보냈습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthMobileLogo />
      <AuthFormCard
        title="비밀번호 찾기"
        subtitle="가입한 이메일로 재설정 링크를 보내드립니다."
      >
        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <strong>{email}</strong>로 재설정 메일을 보냈습니다. 받은편함과 스팸함을 확인해 주세요.
            </div>
            <Link href={AUTH_ROUTES.login} className={`${mkt.btnGreen} inline-flex w-full justify-center`}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthField label="이메일">
                <AuthInput
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@academy.kr"
                />
              </AuthField>
              <AuthSubmitButton loading={loading}>
                {loading ? '전송 중...' : '재설정 메일 보내기'}
              </AuthSubmitButton>
            </form>
            <p className="mt-6 text-center text-sm">
              <Link href={AUTH_ROUTES.login} className={mkt.link}>
                ← 로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </AuthFormCard>
    </>
  );
}
