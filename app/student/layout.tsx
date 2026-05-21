import StudentShell from '@/components/layouts/StudentShell';
import AuthProviders from '@/components/providers/AuthProviders';

export const dynamic = 'force-dynamic';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <StudentShell>{children}</StudentShell>
    </AuthProviders>
  );
}
