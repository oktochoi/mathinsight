'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /signup → /auth?mode=signup */
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth?mode=signup');
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
      회원가입 화면으로 이동 중…
    </div>
  );
}
