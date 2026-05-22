'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { parentReportPath } from '@/lib/documentRoutes';
import { sanitizeParentReportText } from '@/lib/parentReportFormat';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import type { Student } from '@/types/database';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import {
  buildParentRecentChanges,
  buildRecentLessonSummaries,
} from '@/lib/learningFlow';

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
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{child?.name} 학생 학습 현황</h1>
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

      <PortalSchedule
        classIds={[...new Set(children.map((c) => c.class_id).filter(Boolean) as string[])]}
      />

      {logs.length > 0 && (
        <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-100">
          <h3 className="text-sm font-bold text-emerald-900 mb-3">최근 변화</h3>
          <ul className="text-sm text-emerald-800 space-y-1">
            {buildParentRecentChanges(logs).map((line, i) => (
              <li key={i}>· {line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl p-5 bg-white border">
        <h3 className="text-sm font-bold mb-3">최근 수업 요약</h3>
        <ul className="space-y-3 text-sm">
          {buildRecentLessonSummaries(logs, 4).map((s) => (
            <li key={s.date} className="border-b border-slate-50 pb-2 last:border-0">
              <p className="font-medium text-slate-800">{s.date.slice(5)} 수업</p>
              <p className="text-slate-600">· {s.unit}</p>
              <p className="text-slate-500 text-xs">· 숙제 {s.homework}</p>
              {s.memo && <p className="text-slate-500 text-xs">· {s.memo}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl p-5 bg-white border">
        <h3 className="text-sm font-bold mb-2">요약</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
      </div>

      {scoreChart.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white border h-52 sm:h-56 min-w-0">
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
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={parentReportPath(r.id, 'parent')}
                  className="block rounded-xl border border-slate-100 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
                >
                  <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-800">
                    {r.period_start} ~ {r.period_end}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    저장 {r.created_at.slice(0, 10)} · 전체 보기 →
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap font-sans leading-relaxed">
                    {sanitizeParentReportText(r.report_text)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
