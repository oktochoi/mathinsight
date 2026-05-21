import AppShell from '@/components/layouts/AppShell';

/** Supabase 세션·DB 연동 — 정적 prerender 비활성화 */
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
