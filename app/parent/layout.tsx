import ParentShell from '@/components/layouts/ParentShell';
import AuthProviders from '@/components/providers/AuthProviders';

export const dynamic = 'force-dynamic';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <ParentShell>{children}</ParentShell>
    </AuthProviders>
  );
}
