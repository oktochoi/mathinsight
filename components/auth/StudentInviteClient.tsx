'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { normalizeLoginCode } from '@/lib/invite/studentAuth';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField, AuthInput, AuthSubmitButton } from '@/components/auth/AuthField';

type Preview = {
  name: string;
  grade: string;
  academyName: string;
};

type Step = 'confirm' | 'initial-pin' | 'personal-pin';

export function StudentInviteClient({ rawCode }: { rawCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginCode = normalizeLoginCode(rawCode);
  const forcedStep = searchParams.get('step');

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [step, setStep] = useState<Step>(forcedStep === 'pin' ? 'personal-pin' : 'confirm');
  const [initialPin, setInitialPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingPreview(true);
      try {
        const res = await fetch(
          `/api/student-invite/preview?code=${encodeURIComponent(loginCode)}`
        );
        const data = (await res.json()) as Preview & { ok?: boolean };
        if (!cancelled && data.ok !== false && data.name) {
          setPreview({
            name: data.name,
            grade: data.grade,
            academyName: data.academyName,
          });
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loginCode]);

  const signInWithPin = async (pin: string) => {
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
    };
    if (!res.ok || !data.ok || !data.session) {
      throw new Error(data.error ?? '코드 또는 PIN이 올바르지 않습니다.');
    }
    const { error: sessionErr } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (sessionErr) throw new Error('세션 설정에 실패했습니다.');
    return data.pinMustReset ?? false;
  };

  const handleInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const mustReset = await signInWithPin(initialPin);
      if (mustReset) {
        setStep('personal-pin');
        toast.success('개인 PIN을 설정해 주세요.');
      } else {
        toast.success('환영합니다!');
        router.replace('/student');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPin !== newPinConfirm) {
      setError('PIN 확인이 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-student-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginCode, newPin }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'PIN 설정에 실패했습니다.');
      }
      toast.success('PIN이 설정되었습니다. 학생 홈으로 이동합니다.');
      router.replace('/student');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PIN 설정에 실패했습니다.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPreview) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="학생 초대" subtitle="불러오는 중...">
          <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
            잠시만 기다려 주세요
          </p>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  if (!preview) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="초대를 찾을 수 없어요" subtitle="링크가 만료되었거나 잘못되었습니다">
          <p className="text-sm mb-4" style={{ color: 'var(--auth-muted)' }}>
            학원에 문의해 새 초대를 받아 주세요.
          </p>
          <Link href="/login/student" className="auth-link text-sm">
            학생 로그인으로 이동
          </Link>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  if (step === 'confirm') {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="학생 초대" subtitle={`${preview.academyName}`}>
          <div className="text-center space-y-2 mb-6">
            <p className="text-lg font-semibold" style={{ color: 'var(--auth-ink)' }}>
              {preview.name} 학생 맞나요?
            </p>
            <p className="text-sm" style={{ color: 'var(--auth-muted)' }}>
              {preview.grade}
            </p>
          </div>
          <AuthSubmitButton type="button" onClick={() => setStep('initial-pin')}>
            시작하기
          </AuthSubmitButton>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  if (step === 'initial-pin') {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="초기 PIN 입력" subtitle={`${preview.name} · ${preview.academyName}`}>
          {error && <div className="auth-error-banner">{error}</div>}
          <form onSubmit={handleInitialPin} className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--auth-muted)' }}>
              학원에서 받은 초기 PIN(4자리)을 입력하세요.
            </p>
            <AuthField label="초기 PIN">
              <AuthInput
                required
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={initialPin}
                onChange={(e) => setInitialPin(e.target.value.replace(/\D/g, ''))}
                autoComplete="off"
              />
            </AuthField>
            <AuthSubmitButton loading={loading}>
              {loading ? '확인 중...' : '다음'}
            </AuthSubmitButton>
          </form>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  return (
    <AuthPageScaffold>
      <AuthFormCard title="개인 PIN 설정" subtitle="앞으로 사용할 6자리 PIN을 정하세요">
        {error && <div className="auth-error-banner">{error}</div>}
        <form onSubmit={handlePersonalPin} className="space-y-4">
          <AuthField label="새 PIN (6자리)">
            <AuthInput
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              autoComplete="new-password"
            />
          </AuthField>
          <AuthField label="PIN 확인">
            <AuthInput
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPinConfirm}
              onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
              autoComplete="new-password"
            />
          </AuthField>
          <AuthSubmitButton loading={loading}>
            {loading ? '저장 중...' : '완료'}
          </AuthSubmitButton>
        </form>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
