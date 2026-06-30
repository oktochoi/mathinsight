'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parentReportPath } from '@/lib/documentRoutes';
import { SavedDocumentList } from '@/components/documents/SavedDocumentList';
import { ParentReportContent } from '@/components/documents/ParentReportContent';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useParentReports } from '@/hooks/useParentReports';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { fetchAiGenerate } from '@/lib/ai/client';
import { PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { AiRulesFallbackBanner } from '@/components/ui/AiRulesFallbackBanner';
import { STAFF_PAGES } from '@/lib/staffPages';

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 14);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function ParentReportsPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const embedded = pathname?.includes('/parent-hub');
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
  const [editMode, setEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { message: toast, show: showToast } = useToast(3500);

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { reports, loading: reportsLoading, saveReport } = useParentReports(
    studentId || undefined
  );

  useEffect(() => {
    const q = searchParams.get('student');
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId, searchParams]);

  const student = students.find((s) => s.id === studentId);

  const handleGenerate = async () => {
    if (!student) return;
    const periodLogs = logs.filter(
      (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
    );
    if (periodLogs.length === 0) {
      showToast('해당 기간에 수업 기록이 없습니다. 기간을 조정하거나 수업 기록을 먼저 입력해 주세요.');
      return;
    }

    setGenerating(true);
    setAiSource(null);
    setAiFallbackReason(null);
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
      } else if (result.error) {
        showToast(result.error);
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
      showToast(error);
      return;
    }
    showToast('저장되었습니다. 연결된 학부모에게 푸시 알림을 보냅니다.');
    if (reportId) router.push(parentReportPath(reportId));
  };

  if (studentsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <Toast message={toast} />

      {!embedded && (
        <PageHeader
          title={STAFF_PAGES['parent-reports'].title}
          description={STAFF_PAGES['parent-reports'].description}
        >
          {generating && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium animate-pulse" style={{ color: 'var(--app-accent)' }}>
              <i className="ri-sparkling-line" />작성 중…
            </span>
          )}
        </PageHeader>
      )}

      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="app-label mb-1.5">학생</label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setHasGenerated(false);
                setEditMode(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
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
              <label className="app-label mb-1.5">시작</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => {
                  setPeriodStart(e.target.value);
                  setHasGenerated(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
              />
            </div>
            <div className="flex-1">
              <label className="app-label mb-1.5">종료</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => {
                  setPeriodEnd(e.target.value);
                  setHasGenerated(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || !student || logsLoading}
            className="app-btn app-btn-primary w-full sm:w-auto shrink-0 disabled:opacity-50"
          >
            <i className="ri-sparkling-line" />
            {generating ? '만드는 중…' : '리포트 만들기'}
          </button>
        </div>
        {!hasGenerated && !generating && (
          <p className="mt-4 text-xs" style={{ color: 'var(--app-ink-4)' }}>
            학생과 기간을 선택한 뒤 「리포트 만들기」를 눌러 주세요.
          </p>
        )}
      </div>

      {hasGenerated && !generating && (
        <AiRulesFallbackBanner source={aiSource} fallbackReason={aiFallbackReason} />
      )}

      <div
        className="rounded-2xl overflow-hidden min-h-[420px] flex flex-col"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
      >
        {!hasGenerated && !generating ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div>
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>아직 리포트가 없습니다</p>
              <p className="text-xs mt-2" style={{ color: 'var(--app-ink-4)' }}>
                위에서 「리포트 만들기」를 누르면 초안이 생성됩니다
              </p>
            </div>
          </div>
        ) : generating ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>리포트를 작성하고 있습니다…</p>
          </div>
        ) : (
          <>
            <div
              className="px-5 py-3 flex flex-wrap gap-2 justify-between items-center"
              style={{ borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className="app-btn app-btn-ghost text-sm"
                >
                  {editMode ? '미리보기' : '원문 수정'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!reportText.trim()}
                  className="app-btn app-btn-ghost text-sm disabled:opacity-50"
                >
                  저장 전 미리보기
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !reportText.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
            {editMode ? (
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="flex-1 w-full p-6 text-sm leading-relaxed resize-none focus:outline-none min-h-[400px]"
                style={{ color: 'var(--app-ink-2)', background: 'var(--app-surface)', outline: 'none' }}
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

      {previewOpen && student && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.45)' }}
          role="dialog"
          aria-modal
          aria-labelledby="report-preview-title"
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-lg)' }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-b"
              style={{ borderColor: 'var(--app-border)' }}
            >
              <h3 id="report-preview-title" className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
                리포트 미리보기
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-xl leading-none"
                style={{ color: 'var(--app-ink-4)' }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <ParentReportContent
                text={reportText}
                studentName={student.name}
                periodStart={periodStart}
                periodEnd={periodEnd}
              />
            </div>
            <div
              className="flex justify-end gap-2 px-5 py-4 border-t"
              style={{ borderColor: 'var(--app-border)' }}
            >
              <button type="button" onClick={() => setPreviewOpen(false)} className="app-btn app-btn-ghost text-sm">
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  void handleSave();
                }}
                disabled={saving}
                className="app-btn app-btn-primary text-sm disabled:opacity-50"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

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
