import StudentShell from '@/components/layouts/StudentShell';

export const dynamic = 'force-dynamic';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
