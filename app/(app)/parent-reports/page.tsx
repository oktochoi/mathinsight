'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parentReportPath } from '@/lib/documentRoutes';
import { SavedDocumentList } from '@/components/documents/SavedDocumentList';
import { ParentReportContent } from '@/components/documents/ParentReportContent';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { useAuth } from '@/context/AuthContext';
import { fetchAiGenerate } from '@/lib/ai/client';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { StaffPageIntro } from '@/components/ui/StaffPageIntro';
import { STAFF_PAGES } from '@/lib/staffPages';
import { AiSourceBadge } from '@/components/ai/AiSourceBadge';

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 14);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function ParentReportsPage() {
  const router = useRouter();
  const { academy } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const period = useMemo(defaultPeriod, []);
  const [studentId, setStudentId] = useState('');
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const [reportText, setReportText] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'rules' | null>(null);
  const [aiFallbackReason, setAiFallbackReason] = useState<string | null>(null);
  const [aiBackend, setAiBackend] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [editMode, setEditMode] = useState(false);

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { reports, loading: reportsLoading, saveReport } = useParentReports(
    studentId || undefined
  );

  useEffect(() => {
    const q =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('student')
        : null;
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId]);

  const student = students.find((s) => s.id === studentId);

  const handleGenerate = async () => {
    if (!student) return;
    const periodLogs = logs.filter(
      (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
    );
    if (periodLogs.length === 0) {
      setToast('해당 기간에 수업 기록이 없습니다. 기간을 조정하거나 수업 기록을 먼저 입력해 주세요.');
      setTimeout(() => setToast(''), 3500);
      return;
    }

    setGenerating(true);
    setAiSource(null);
    setAiFallbackReason(null);
    setAiBackend(null);
    try {
      const result = await fetchAiGenerate({
        task: 'parentReport',
        logs: periodLogs,
        student: { name: student.name, grade: student.grade },
        periodStart,
        periodEnd,
        tone: 'friendly',
        academyName: academy?.name ?? '학원',
      });
      if (result.ok && result.text) {
        setReportText(result.text);
        setHasGenerated(true);
        setAiSource(result.source ?? null);
        setAiFallbackReason(result.fallbackReason ?? null);
        setAiBackend(result.backend ?? null);
      } else if (result.error) {
        setToast(result.error);
        setTimeout(() => setToast(''), 3500);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!studentId || !reportText.trim()) return;
    setSaving(true);
    const { error, reportId } = await saveReport({
      student_id: studentId,
      generated_by: null,
      period_start: periodStart,
      period_end: periodEnd,
      tone: 'friendly',
      report_text: reportText,
    });
    setSaving(false);
    if (error) {
      setToast(error);
      setTimeout(() => setToast(''), 2500);
      return;
    }
    setToast('저장되었습니다.');
    setTimeout(() => setToast(''), 2500);
    if (reportId) router.push(parentReportPath(reportId));
  };

  if (studentsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {toast && (
        <div className="fixed top-20 right-8 z-50 rounded-xl px-5 py-3 text-sm text-white bg-emerald-600 shadow-lg">
          {toast}
        </div>
      )}

      <PageHeader
        title={STAFF_PAGES['parent-reports'].title}
        description={STAFF_PAGES['parent-reports'].description}
      >
        {hasGenerated && (
          <AiSourceBadge
            source={aiSource}
            backend={aiBackend}
            fallbackReason={aiFallbackReason}
            generating={generating}
          />
        )}
      </PageHeader>
      <StaffPageIntro pageKey="parent-reports" />

      <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">학생</label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setHasGenerated(false);
                setEditMode(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-1 min-w-[240px]">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">시작</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => {
                  setPeriodStart(e.target.value);
                  setHasGenerated(false);
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">종료</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => {
                  setPeriodEnd(e.target.value);
                  setHasGenerated(false);
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || !student || logsLoading}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shrink-0 shadow-sm shadow-indigo-200/50"
          >
            {generating ? '만드는 중…' : '리포트 만들기'}
          </button>
        </div>
        {!hasGenerated && !generating && (
          <p className="mt-4 text-xs text-slate-400">
            학생과 기간을 선택한 뒤 「리포트 만들기」를 눌러 주세요.
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden min-h-[420px] flex flex-col">
        {!hasGenerated && !generating ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div>
              <p className="text-slate-400 text-sm">아직 리포트가 없습니다</p>
              <p className="text-slate-300 text-xs mt-2">
                위에서 「리포트 만들기」를 누르면 초안이 생성됩니다
              </p>
            </div>
          </div>
        ) : generating ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="text-slate-500 text-sm">리포트를 작성하고 있습니다…</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2 justify-between items-center bg-slate-50/50">
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-white cursor-pointer"
              >
                {editMode ? '미리보기' : '원문 수정'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !reportText.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
            {editMode ? (
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="flex-1 w-full p-6 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none min-h-[400px] font-mono text-xs"
                placeholder="생성된 리포트 원문"
              />
            ) : (
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto min-h-[400px]">
                {student && (
                  <ParentReportContent
                    text={reportText}
                    studentName={student.name}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SavedDocumentList
        title="저장된 학부모 리포트"
        loading={reportsLoading}
        items={reports.slice(0, 12).map((r) => ({
          id: r.id,
          href: parentReportPath(r.id),
          primary: `${(r.students as { name?: string })?.name ?? '학생'} · ${r.period_start} ~ ${r.period_end}`,
          secondary: `저장 ${r.created_at.slice(0, 10)}`,
        }))}
      />
    </div>
  );
}
