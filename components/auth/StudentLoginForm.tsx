'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { normalizeLoginCode } from '@/lib/invite/studentAuth';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField, AuthInput, AuthSubmitButton } from '@/components/auth/AuthField';

function StudentLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginCode, setLoginCode] = useState(searchParams.get('code') ?? '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginCode, pin }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        session?: { access_token: string; refresh_token: string };
        pinMustReset?: boolean;
        loginCode?: string;
      };

      if (!res.ok || !data.ok || !data.session) {
        const msg = data.error ?? '코드 또는 PIN이 올바르지 않습니다.';
        setError(msg);
        toast.error(msg);
        return;
      }

      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionErr) {
        setError('세션 설정에 실패했습니다.');
        return;
      }

      toast.success('로그인되었습니다.');
      const code = data.loginCode ?? normalizeLoginCode(loginCode);
      if (data.pinMustReset) {
        router.replace(`/student-invite/${code.replace(/-/g, '')}?step=pin`);
        return;
      }
      router.replace('/student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageScaffold>
      <AuthFormCard title="학생 로그인" subtitle="학원에서 받은 코드와 PIN을 입력하세요">
        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="로그인 코드">
            <AuthInput
              required
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              autoComplete="username"
              className="font-mono tracking-wider"
            />
          </AuthField>
          <AuthField label="PIN">
            <AuthInput
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="6자리 PIN"
              autoComplete="current-password"
            />
          </AuthField>
          <AuthSubmitButton loading={loading}>{loading ? '로그인 중...' : '로그인'}</AuthSubmitButton>
        </form>

        <p className="mt-4 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          학원에서 받은 QR·초대 링크가 있으신가요? 링크를 열어 주세요.
          {' · '}
          <Link href="/login" className="auth-link">
            학원·학부모 로그인
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--auth-muted)' }}>
          PIN을 잊으셨다면 학원에 문의해 주세요.
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}

export function StudentLoginForm() {
  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="학생 로그인" subtitle="불러오는 중...">
            <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
              잠시만 기다려 주세요
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <StudentLoginFormInner />
    </Suspense>
  );
}
