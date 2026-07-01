'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/lib/auth';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mounted) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && mounted) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      toast.success('비밀번호가 변경되었습니다.');
      router.replace(`${AUTH_ROUTES.login}?reset=1`);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="비밀번호 재설정" subtitle="링크를 확인하는 중...">
          <p className="py-6 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
            재설정 링크가 유효한지 확인하고 있습니다.
          </p>
          <p className="text-center text-sm">
            <Link href={AUTH_ROUTES.forgotPassword} className="auth-link">
              재설정 메일 다시 받기
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  return (
    <AuthPageScaffold>
      <AuthFormCard title="새 비밀번호 설정" subtitle="8자 이상의 새 비밀번호를 입력해 주세요.">
        {error && <div className="auth-error-banner">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="새 비밀번호">
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
          <AuthField label="새 비밀번호 확인">
            <AuthInput
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </AuthField>
          <AuthSubmitButton loading={loading}>
            {loading ? '저장 중...' : '비밀번호 재설정'}
          </AuthSubmitButton>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href={AUTH_ROUTES.login} className="auth-link">
            ← 로그인으로 돌아가기
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
