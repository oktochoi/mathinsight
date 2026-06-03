'use client';

import { PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { StaffPageIntro } from '@/components/ui/StaffPageIntro';
import { STAFF_PAGES } from '@/lib/staffPages';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsPage() {
  const { loading, profile } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title={STAFF_PAGES.analytics.title}
        description={
          profile?.academy_id
            ? STAFF_PAGES.analytics.description
            : '학원 정보가 연결되면 분석을 제공합니다.'
        }
      />
      <StaffPageIntro pageKey="analytics" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { icon: 'ri-bar-chart-2-line', title: '학년별 성적 분석' },
          { icon: 'ri-team-line', title: '학생 유입·이탈 분석' },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl p-6 h-56 flex items-center justify-center bg-white border border-slate-200"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-blue-50">
                <i className={`${card.icon} text-blue-500 text-xl`}></i>
              </div>
              <p className="text-sm text-slate-600 font-medium">{card.title}</p>
              <p className="text-xs text-slate-400 mt-1">준비 중</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
