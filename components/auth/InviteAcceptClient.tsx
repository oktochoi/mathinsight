'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile } from '@/lib/auth';
import { fetchPostAuthDestination } from '@/lib/workspace/postAuthClient';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthSubmitButton } from '@/components/auth/AuthField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

type Preview = {
  ok?: boolean;
  error?: string;
  academy_name?: string;
  role?: string;
  invited_name?: string;
  target_email?: string;
  student_name?: string;
};

const ROLE_LABEL: Record<string, string> = {
  parent: '학부모',
  teacher: '강사',
  desk: '원무',
  owner: '원장',
};

export function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUserEmail(user?.email ?? null);

      const res = await fetch(`/api/invite/preview?token=${encodeURIComponent(token)}`);
      const data = (await res.json()) as Preview;
      if (!cancelled) {
        setPreview(data);
        setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        expected_email?: string;
        role?: string;
      };

      if (!res.ok || !data.ok) {
        if (data.error === 'email_mismatch' && data.expected_email) {
          const msg = `이 초대는 ${data.expected_email} 전용입니다. 해당 계정으로 로그인해 주세요.`;
          setError(msg);
          toast.error(msg);
          return;
        }
        throw new Error(
          data.error === 'expired'
            ? '초대 링크가 만료되었습니다. 학원에 재초대를 요청해 주세요.'
            : data.error === 'invalid_token'
              ? '유효하지 않은 초대 링크입니다.'
              : '초대 수락에 실패했습니다.'
        );
      }

      toast.success('초대가 완료되었습니다.');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await fetchUserProfile(user.id);
        const dest = await fetchPostAuthDestination(
          `/invite/${token}`,
          profile?.role ? String(profile.role) : null
        );
        router.replace(dest);
      } else {
        router.replace('/login');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '초대 수락에 실패했습니다.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPreview) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="초대 확인" subtitle="불러오는 중...">
          <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
            잠시만 기다려 주세요
          </p>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  if (!preview?.ok) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="초대를 찾을 수 없어요" subtitle="링크가 만료되었거나 잘못되었습니다">
          <Link href="/login" className="auth-link text-sm">
            로그인으로 이동
          </Link>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  const roleLabel = ROLE_LABEL[preview.role ?? ''] ?? preview.role;

  return (
    <AuthPageScaffold>
      <AuthFormCard
        title={`${preview.academy_name ?? '학원'} 초대`}
        subtitle={`${roleLabel} 계정으로 연결됩니다`}
      >
        {error && <div className="auth-error-banner">{error}</div>}

        <div className="rounded-xl p-4 mb-5 space-y-1" style={{ background: 'var(--auth-surface-2)' }}>
          {preview.invited_name && (
            <p className="text-sm font-semibold" style={{ color: 'var(--auth-ink)' }}>
              {preview.invited_name} 님
            </p>
          )}
          {preview.student_name && (
            <p className="text-xs" style={{ color: 'var(--auth-muted)' }}>
              자녀: {preview.student_name}
            </p>
          )}
          {preview.target_email && (
            <p className="text-xs" style={{ color: 'var(--auth-muted)' }}>
              초대 이메일: {preview.target_email}
            </p>
          )}
        </div>

        {!userEmail ? (
          <div className="space-y-4">
            <p className="text-xs text-center" style={{ color: 'var(--auth-muted)' }}>
              초대를 수락하려면 먼저 로그인하세요. Google 계정 이메일이 초대 이메일과 일치해야 합니다.
            </p>
            <GoogleSignInButton />
            <p className="text-center text-xs">
              <Link href={`/login?next=/invite/${encodeURIComponent(token)}`} className="auth-link">
                휴대폰으로 로그인
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-center" style={{ color: 'var(--auth-muted)' }}>
              로그인: {userEmail}
            </p>
            {preview.target_email &&
              userEmail.toLowerCase() !== preview.target_email.toLowerCase() && (
                <p className="auth-error-banner text-xs">
                  이 초대는 {preview.target_email} 전용입니다. 다른 계정으로 로그인해 주세요.
                </p>
              )}
            <AuthSubmitButton
              loading={loading}
              type="button"
              onClick={handleAccept}
              disabled={
                !!preview.target_email &&
                userEmail.toLowerCase() !== preview.target_email.toLowerCase()
              }
            >
              {loading ? '처리 중...' : '초대 수락하기'}
            </AuthSubmitButton>
          </div>
        )}
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
