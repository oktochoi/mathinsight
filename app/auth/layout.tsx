import { Suspense } from 'react';
import { AuthSessionRedirect } from '@/components/auth/AuthSessionRedirect';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
          확인 중…
        </div>
      }
    >
      <AuthSessionRedirect>{children}</AuthSessionRedirect>
    </Suspense>
  );
}
