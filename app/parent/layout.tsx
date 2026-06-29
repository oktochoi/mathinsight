import ParentShell from '@/components/layouts/ParentShell';
import AuthProviders from '@/components/providers/AuthProviders';
import { getServerAuthProfile } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getServerAuthProfile();

  return (
    <AuthProviders initialProfile={profile}>
      <ParentShell>{children}</ParentShell>
    </AuthProviders>
  );
}
