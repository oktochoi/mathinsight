import { AuthShell } from '@/components/auth/AuthShell';

export const dynamic = 'force-dynamic';

export default function AuthLegacyLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
