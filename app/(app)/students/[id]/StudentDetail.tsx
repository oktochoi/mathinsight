'use client';

import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useStudent } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import {
  calculateScoreTrend,
  calculateHomeworkTrend,
  getRecentUnits,
  getRepeatedTags,
} from '@/lib/analytics';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { STATUS_LABELS, STATUS_STYLES, HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import {
  isParentLinked,
  isStudentPortalLinked,
  studentParentEmail,
  studentPortalEmail,
} from '@/lib/studentPortal';

export default function StudentDetail({
  studentId,
  embed = false,
}: {
  studentId: string;
  embed?: boolean;
}) {
  const { student, loading: studentLoading, error: studentError, refetch } = useStudent(studentId);
  const { logs, loading: logsLoading, error: logsError } = useLessonLogs({ studentId, limit: 50 });

  if (studentLoading) return <PageLoader />;
  if (studentError) return <ErrorBanner message={studentError} onRetry={refetch} />;
  if (!student) return <EmptyState title="학생을 찾을 수 없습니다" />;

  const scoreTrend = calculateScoreTrend(logs);
  const hwTrend = calculateHomeworkTrend(logs);
  const units = getRecentUnits(logs);
  const repeatedTags = getRepeatedTags(logs);
  const summary = generateLearningSummary(logs, student.name);

  const scoreChart = scoreTrend.points.map((p) => ({ label: p.date, score: p.score }));
  const hwChart = hwTrend.weeklyRates;

  return (
    <div className="space-y-6">
      {!embed && (
        <Link href="/students" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
          <i className="ri-arrow-left-line"></i>학생 목록
        </Link>
      )}

      {logsError && <ErrorBanner message={logsError} />}

      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1e32)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {student.grade} · {(student.classes as { name?: string })?.name ?? '반 미지정'} ·{' '}
              {student.school || '학교 미입력'}
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border ${STATUS_STYLES[student.status]}`}>
            {STATUS_LABELS[student.status]}
          </span>
        </div>
        <div className="mt-4 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-xs text-slate-300 space-y-1">
          <p>
            학부모 이메일:{' '}
            <span className="text-white">{studentParentEmail(student) || '—'}</span>{' '}
            {isParentLinked(student) ? (
              <span className="text-emerald-300">(로그인 연결됨)</span>
            ) : studentParentEmail(student) ? (
              <span className="text-amber-200">(계정 미연결 — 학부모 가입 후 다시 저장)</span>
            ) : null}
          </p>
          <p>
            학생 이메일:{' '}
            <span className="text-white">{studentPortalEmail(student) || '—'}</span>{' '}
            {isStudentPortalLinked(student) ? (
              <span className="text-emerald-300">(로그인 연결됨)</span>
            ) : studentPortalEmail(student) ? (
              <span className="text-amber-200">(계정 미연결)</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <Link href={`/consultation-cards?student=${studentId}`}>
            <button type="button" className="text-xs px-4 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer">
              상담 카드
            </button>
          </Link>
          <Link href={`/parent-reports?student=${studentId}`}>
            <button type="button" className="text-xs px-4 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer">
              학부모 리포트
            </button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-2">학습 요약 (기록 기반)</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
        {repeatedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {repeatedTags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                {t}
              </span>
            ))}
          </div>
        )}
        {units.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">최근 단원: {units.join(', ')}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5 bg-white border border-slate-200">
          <h3 className="text-sm font-bold mb-4">점수 추이</h3>
          {scoreChart.length === 0 ? (
            <EmptyState title="점수 기록 없음" icon="ri-line-chart-line" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={scoreChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl p-5 bg-white border border-slate-200">
          <h3 className="text-sm font-bold mb-4">숙제 완료율 (주별)</h3>
          {hwChart.every((w) => w.rate === 0) ? (
            <EmptyState title="숙제 기록 없음" icon="ri-stack-line" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="rate" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
        <h3 className="text-sm font-bold px-6 py-4 border-b border-slate-100">최근 수업 기록</h3>
        {logsLoading ? (
          <PageLoader />
        ) : logs.length === 0 ? (
          <EmptyState title="수업 기록이 없습니다" description="수업 기록 입력에서 기록을 추가하세요." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left">날짜</th>
                <th className="px-6 py-3 text-left">단원</th>
                <th className="px-6 py-3">출결</th>
                <th className="px-6 py-3">숙제</th>
                <th className="px-6 py-3">점수</th>
                <th className="px-6 py-3 text-left">태그</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-3">{log.lesson_date}</td>
                  <td className="px-6 py-3">{log.unit || '-'}</td>
                  <td className="px-6 py-3 text-center">{ATTENDANCE_LABELS[log.attendance_status]}</td>
                  <td className="px-6 py-3 text-center">{HOMEWORK_LABELS[log.homework_status]}</td>
                  <td className="px-6 py-3 text-center">{log.test_score ?? '-'}</td>
                  <td className="px-6 py-3 text-slate-500">{(log.tags ?? []).join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
