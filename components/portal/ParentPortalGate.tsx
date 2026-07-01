'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortalChild } from '@/context/PortalChildContext';
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { formatPhoneDisplay } from '@/lib/phone';

export function ParentPortalGate({ children: render }: { children: (childId: string) => ReactNode }) {
  const { profile } = useAuth();
  const { child, children: childList, loading, error, reload } = usePortalChild();

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;

  if (childList.length === 0) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-8">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
            <i className="ri-parent-line text-indigo-500 text-2xl" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-stone-900">자녀를 연결해 주세요</h2>
          <p className="text-sm text-stone-500 mt-1">
            학원 코드를 입력하고 보호자 정보를 확인하면 바로 이용할 수 있습니다.
          </p>
        </div>
        <div className="parent-card p-5 space-y-4">
          <ConnectStudentPanel mode="parent" onSubmitted={() => void reload()} />
        </div>
        <div className="parent-card p-4 text-xs text-stone-500 space-y-1">
          <p>
            로그인 아이디:{' '}
            <strong className="text-stone-700">
              {profile?.phone ? formatPhoneDisplay(profile.phone) : profile?.email}
            </strong>
          </p>
        </div>
      </div>
    );
  }

  if (!child) return null;
  return <>{render(child.id)}</>;
}
