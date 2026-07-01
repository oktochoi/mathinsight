'use client';

import type { ReactNode } from 'react';
import { useStudentPortal } from '@/context/StudentPortalContext';
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneDisplay } from '@/lib/phone';

export function StudentPortalGate({ children }: { children: () => ReactNode }) {
  const { profile } = useAuth();
  const { student, loading, error, reload } = useStudentPortal();

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  if (!student) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-8">
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-slate-900">학원을 연결해 주세요</h2>
          <p className="text-sm text-slate-500 mt-1">학원 코드를 입력하면 바로 이용할 수 있습니다.</p>
        </div>
        <div className="student-card p-5">
          <ConnectStudentPanel mode="student" onSubmitted={() => void reload()} />
        </div>
        <div className="student-card p-4 text-xs text-slate-500">
          로그인:{' '}
          <strong>{profile?.phone ? formatPhoneDisplay(profile.phone) : profile?.email}</strong>
        </div>
      </div>
    );
  }

  return <>{children()}</>;
}
