'use client';

import Link from 'next/link';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthSignupFooter } from '@/components/auth/AuthFooter';
import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';

export function SignupForm() {
  return (
    <AuthPageScaffold>
      <AuthFormCard title="학원 개설" subtitle="원장 계정으로 EduFlow를 시작하세요">
        <p className="text-sm auth-info-banner mb-4">
          학생·학부모·강사·원무는 학원 초대로만 가입할 수 있습니다. 원장만 여기서 직접 가입합니다.
        </p>

        <GoogleSignInButton label="Google로 가입하기" />
        <p className="text-[11px] text-center mt-2" style={{ color: 'var(--auth-muted)' }}>
          Google 가입 후에도 휴대폰 인증이 필요합니다.
        </p>
        <AuthDivider />

        <PhoneSignupWizard mode="owner" embedded />

        <AuthSignupFooter />
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="auth-link">
            로그인
          </Link>
        </p>
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          초대를 받으셨나요?{' '}
          <Link href="/login" className="auth-link">
            초대 링크로 로그인
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
