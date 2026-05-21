import ParentShell from '@/components/layouts/ParentShell';

export const dynamic = 'force-dynamic';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
