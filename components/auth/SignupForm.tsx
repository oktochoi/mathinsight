'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { SignupRole } from '@/lib/roles';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { RolePicker } from '@/components/auth/RolePicker';
import { AuthSignupFooter } from '@/components/auth/AuthFooter';
import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';
import { peekPendingAcademyCode } from '@/lib/academyCodeStorage';

function SignupFormInner() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<SignupRole>('owner');

  const pendingAcademyCode = peekPendingAcademyCode();

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'teacher' || r === 'owner' || r === 'parent' || r === 'student') {
      setRole(r);
    }
  }, [searchParams]);

  const roleLabels: Record<SignupRole, string> = {
    owner: '원장 (학원 운영)',
    teacher: '강사',
    parent: '학부모',
    student: '학생',
  };

  const phoneMode =
    role === 'owner' ? 'owner' : role === 'teacher' ? 'teacher' : role;

  return (
    <AuthPageScaffold>
      <AuthFormCard title="회원가입" subtitle="역할을 선택하고 계정을 만들어 주세요">
        <GoogleSignInButton label="Google로 가입하기" />
        <p className="text-[11px] text-center mt-2" style={{ color: 'var(--auth-muted)' }}>
          Google 가입 후에도 휴대폰 인증이 필요합니다.
        </p>
        <AuthDivider />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--auth-ink)' }}>
              역할 선택
            </p>
            <RolePicker value={role} onChange={setRole} />
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--auth-muted)' }}>
              선택:{' '}
              <span className="font-semibold" style={{ color: 'var(--auth-ink)' }}>
                {roleLabels[role]}
              </span>
              {role === 'teacher' && ' · 가입 후 학원 초대 코드로 연결합니다'}
            </p>
            {role === 'teacher' && pendingAcademyCode && (
              <p className="auth-info-banner mt-2 text-xs">
                학원 코드 <strong className="font-mono">{pendingAcademyCode}</strong>가 저장되어 있습니다.
                온보딩에서 자동으로 입력됩니다.
              </p>
            )}
          </div>

          <p className="text-sm auth-info-banner">
            {role === 'owner' || role === 'teacher'
              ? '휴대폰 인증으로 가입합니다. 가입 후 온보딩을 진행합니다.'
              : '휴대폰 인증으로 가입합니다. 학원 연결은 로그인 후 포털에서 진행합니다.'}
          </p>

          <PhoneSignupWizard mode={phoneMode} embedded />
        </div>

        <AuthSignupFooter />
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="auth-link">
            로그인
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}

export function SignupForm() {
  return <SignupFormInner />;
}
