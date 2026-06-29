import StudentShell from '@/components/layouts/StudentShell';
import AuthProviders from '@/components/providers/AuthProviders';
import { getServerAuthProfile } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getServerAuthProfile();

  return (
    <AuthProviders initialProfile={profile}>
      <StudentShell>{children}</StudentShell>
    </AuthProviders>
  );
}
