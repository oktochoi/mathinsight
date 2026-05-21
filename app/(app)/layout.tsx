import AppShell from '@/components/layouts/AppShell';
import AuthProviders from '@/components/providers/AuthProviders';

/** Supabase 세션·DB 연동 — 정적 prerender 비활성화 */
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <AppShell>{children}</AppShell>
    </AuthProviders>
  );
}
