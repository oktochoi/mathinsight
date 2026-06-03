'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/auth?${q}` : '/auth');
  }, [router, searchParams]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
      로그인 화면으로 이동 중…
    </div>
  );
}

/** /login → /auth (미들웨어·클라이언트 리다이렉트, 서버 redirect RSC 오류 방지) */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
          로그인 화면으로 이동 중…
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}
