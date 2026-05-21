'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { useAuth } from '@/context/AuthContext';
import { generateParentReport } from '@/lib/reportGenerator';
import type { ReportTone } from '@/types/database';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';

const tones: { label: string; value: ReportTone }[] = [
  { label: '친근함', value: 'friendly' },
  { label: '객관적', value: 'objective' },
  { label: '입시 중심', value: 'exam_focused' },
  { label: '격려', value: 'encouraging' },
];

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function ParentReportsPage() {
  const { academy } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const period = useMemo(defaultPeriod, []);
  const [studentId, setStudentId] = useState('');
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const [tone, setTone] = useState<ReportTone>('objective');
  const [reportText, setReportText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { reports, loading: reportsLoading, saveReport } = useParentReports();

  useEffect(() => {
    const q =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('student')
        : null;
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId]);

  const student = students.find((s) => s.id === studentId);

  const handleGenerate = () => {
    if (!student) return;
    const periodLogs = logs.filter(
      (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
    );
    setReportText(
      generateParentReport(
        periodLogs,
        student,
        periodStart,
        periodEnd,
        tone,
        academy?.name ?? '학원'
      )
    );
  };

  useEffect(() => {
    if (student && !logsLoading) handleGenerate();
  }, [studentId, periodStart, periodEnd, tone, logs.length, logsLoading]);

  const handleSave = async () => {
    if (!studentId || !reportText) return;
    setSaving(true);
    const { error } = await saveReport({
      student_id: studentId,
      generated_by: null,
      period_start: periodStart,
      period_end: periodEnd,
      tone,
      report_text: reportText,
    });
    setSaving(false);
    setToast(error ? error : '저장되었습니다.');
    setTimeout(() => setToast(''), 2500);
  };

  if (studentsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-8 z-50 rounded-xl px-5 py-3 text-sm text-white bg-emerald-600">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parent Reports</h1>
        <p className="text-sm text-slate-500 mt-1">기록 기반 학부모 리포트</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-white border border-slate-200">
            <h3 className="text-sm font-bold mb-3">학생</h3>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-slate-200 space-y-3">
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
            {tones.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm border cursor-pointer ${
                  tone === t.value ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button type="button" onClick={handleGenerate} className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm cursor-pointer">
              생성
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50 cursor-pointer"
            >
              저장
            </button>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-slate-200">
            <h3 className="text-sm font-bold mb-2">최근 리포트</h3>
            {reportsLoading ? (
              <p className="text-xs text-slate-400">로딩...</p>
            ) : reports.length === 0 ? (
              <EmptyState title="없음" />
            ) : (
              <ul className="text-xs space-y-2">
                {reports.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    {(r.students as { name?: string })?.name} · {r.created_at.slice(0, 10)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 rounded-2xl p-6 bg-white border border-slate-200">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="w-full h-[480px] text-sm text-slate-700 leading-relaxed resize-none focus:outline-none font-mono"
            placeholder="리포트를 생성하세요"
          />
        </div>
      </div>
    </div>
  );
}
