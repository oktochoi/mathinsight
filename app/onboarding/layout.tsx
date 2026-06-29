import type { ReactNode } from 'react';
import AuthProviders from '@/components/providers/AuthProviders';
import { getServerAuthProfile } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { profile } = await getServerAuthProfile();
  return (
    <AuthProviders initialProfile={profile}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {children}
      </div>
    </AuthProviders>
  );
}
