import { Suspense, use } from 'react';
import { InviteAcceptClient } from '@/components/auth/InviteAcceptClient';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  return (
    <Suspense
      fallback={
        <AuthPageScaffold>
          <AuthFormCard title="초대 확인" subtitle="불러오는 중...">
            <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
              잠시만 기다려 주세요
            </p>
          </AuthFormCard>
        </AuthPageScaffold>
      }
    >
      <InviteAcceptClient token={token} />
    </Suspense>
  );
}
