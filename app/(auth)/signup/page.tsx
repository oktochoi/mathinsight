import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="회원가입" subtitle="불러오는 중…">
            <p className="py-12 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
              잠시만 기다려 주세요
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
