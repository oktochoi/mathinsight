'use client';

import { PageLoader } from '@/components/ui/DataStates';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsPage() {
  const { loading, profile } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600">
          분석
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          {profile?.academy_id
            ? '학원 전반 학습·운영 지표 (추가 분석 기능 예정)'
            : '학원 정보가 연결되면 분석을 제공합니다.'}
        </p>
      </div>
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
