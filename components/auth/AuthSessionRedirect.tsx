'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile, resolvePostLoginPath } from '@/lib/auth';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { hasAssignedDbRole } from '@/lib/authProfileSetup';

type Props = {
  children: React.ReactNode;
};

export function AuthSessionRedirect({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setReady(true);
        return;
      }

      await fetchUserProfile(user.id);

      const { data: roleRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const rawDbRole = (roleRow?.role as string | null) ?? null;

      const chooseRolePath = '/auth/choose-role';
      const authPath = '/auth';

      if (pathname === chooseRolePath) {
        if (hasAssignedDbRole(rawDbRole)) {
          router.replace(postAuthDestination(user, null, rawDbRole));
          return;
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (pathname === authPath) {
        if (!hasAssignedDbRole(rawDbRole)) {
          router.replace(chooseRolePath);
          return;
        }
        const dest = resolvePostLoginPath(user, null, searchParams.get('next'), rawDbRole);
        router.replace(dest);
        return;
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">
        확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
