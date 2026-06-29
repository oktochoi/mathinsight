import AppShell from '@/components/layouts/AppShell';
import AuthProviders from '@/components/providers/AuthProviders';
import { getServerAuthProfile } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getServerAuthProfile();

  return (
    <AuthProviders initialProfile={profile}>
      <AppShell>{children}</AppShell>
    </AuthProviders>
  );
}
