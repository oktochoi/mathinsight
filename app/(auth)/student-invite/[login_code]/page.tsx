import { Suspense, use } from 'react';
import { StudentInviteClient } from '@/components/auth/StudentInviteClient';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export default function StudentInvitePage({
  params,
}: {
  params: Promise<{ login_code: string }>;
}) {
  const { login_code } = use(params);

  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="학생 초대" subtitle="불러오는 중...">
            <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
              잠시만 기다려 주세요
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <StudentInviteClient rawCode={login_code} />
    </Suspense>
  );
}
