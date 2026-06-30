import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-slate-500">불러오는 중…</p>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
