'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import type { Student } from '@/types/database';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function ParentPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('students')
        .select('*, academies(id, name)')
        .eq('parent_user_id', profile.id);
      if (err) setError('자녀 정보를 불러오지 못했습니다.');
      else {
        const list = (data ?? []) as Student[];
        setChildren(list);
        if (list[0]) setSelectedId(list[0].id);
      }
      setLoading(false);
    })();
  }, [profile?.id]);

  const child = children.find((c) => c.id === selectedId);
  const { logs } = useLessonLogs({ studentId: selectedId, limit: 30 });
  const { reports, loading: reportsLoading } = useParentReports(selectedId);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;
  if (children.length === 0) {
    return (
      <EmptyState
        title="연결된 자녀가 없습니다"
        description="학원 원장이 학생 관리에서 이 계정(학부모) 가입 이메일을 입력·저장해야 합니다. 이메일이 일치하고 저장 후 연결됨(✓)이면 수업·리포트가 보입니다."
      />
    );
  }

  const summary = child ? generateLearningSummary(logs, child.name) : '';
  const scoreChart = calculateScoreTrend(logs).points;
  const hw = calculateHomeworkTrend(logs);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {children.length > 1 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm"
        >
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{child?.name} 학생 학습 현황</h1>
        <p className="text-sm text-slate-500 mt-1">
          {(child as Student & { academies?: { name: string } })?.academies?.name ?? '연결된 학원'} ·{' '}
          {child?.grade} · 최근 기록 기준
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-white border">
          <p className="text-xs text-slate-500">최근 수업</p>
          <p className="text-xl font-bold">{logs.length}건</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border">
          <p className="text-xs text-slate-500">숙제 완료율</p>
          <p className="text-xl font-bold">{hw.recentRate}%</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border">
          <p className="text-xs text-slate-500">최근 평균 점수</p>
          <p className="text-xl font-bold">{calculateScoreTrend(logs).recentAvg ?? '-'}</p>
        </div>
        <div className="rounded-2xl p-4 bg-white border">
          <p className="text-xs text-slate-500">리포트</p>
          <p className="text-xl font-bold">{reports.length}건</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white border">
        <h3 className="text-sm font-bold mb-2">요약</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
      </div>

      {scoreChart.length > 0 && (
        <div className="rounded-2xl p-5 bg-white border h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreChart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl p-5 bg-white border">
        <h3 className="text-sm font-bold mb-3">학부모 리포트</h3>
        {reportsLoading ? (
          <p className="text-sm text-slate-400">로딩...</p>
        ) : reports.length === 0 ? (
          <EmptyState title="아직 리포트가 없습니다" />
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-4">
                <p className="text-xs text-slate-400 mb-2">
                  {r.period_start} ~ {r.period_end} · {r.created_at.slice(0, 10)}
                </p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{r.report_text}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
