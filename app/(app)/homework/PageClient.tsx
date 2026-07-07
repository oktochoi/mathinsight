'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClassStudentIds } from '@/hooks/useClassStudentIds';
import { useClasses, useLessonLogs } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { useHomeworkAssignments } from '@/hooks/useHomeworkAssignments';
import { useAppStore } from '@/store/useAppStore';
import { loadClassDayData } from '@/lib/lessonOperationalRead';
import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { useToast } from '@/hooks/useToast';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { LessonLogsHintBanner } from '@/components/staff/LessonLogsHintBanner';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';
import type { HomeworkStatus, LessonLog, LessonLogInsert } from '@/types/database';

const homeworkOptions: { value: HomeworkStatus; label: string; style: string }[] = [
  { value: 'complete', label: '완료', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'partial', label: '부분', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'missing', label: '미제출', style: 'bg-red-100 text-red-800 border-red-200' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function HomeworkPageContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const { profile } = useAuth();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const { classes, loading: classesLoading } = useClasses();
  const { students, loading: studentsLoading } = useStudents();
  const { upsertLogs } = useLessonLogs();
  const { assignments, loading: hwLoading, createAssignment, fetchSubmissions, saveSubmissions } =
    useHomeworkAssignments();

  const [tab, setTab] = useState<'daily' | 'assignments'>(
    tabFromUrl === 'assignments' ? 'assignments' : 'daily'
  );
  const [date, setDate] = useState(searchParams.get('date') ?? todayStr());
  const [classId, setClassId] = useState('');
  const [hwByStudent, setHwByStudent] = useState<Record<string, HomeworkStatus>>({});
  const [existingLogs, setExistingLogs] = useState<Map<string, LessonLog>>(new Map());
  const [missingOnly, setMissingOnly] = useState(searchParams.get('filter') === 'missing');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { message: toast, show: showToast } = useToast(2500);
  const isDirtyRef = useRef(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState(todayStr());
  const [newDesc, setNewDesc] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissionRows, setSubmissionRows] = useState<
    { student_id: string; name: string; grade: string; status: HomeworkStatus; memo: string }[]
  >([]);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  const { classStudents, studentIds, studentIdsKey } = useClassStudentIds(students, classId);

  useEffect(() => {
    isDirtyRef.current = false;
  }, [classId, date, studentIdsKey, tab]);

  const loadDayLogs = useCallback(
    async (force = false) => {
      if (!profile?.academy_id || !classId || !studentIdsKey) return;
      if (!force && isDirtyRef.current) return;
      const { existingLogs, homework } = await loadClassDayData(
        profile.academy_id,
        classId,
        date,
        studentIds
      );
      if (!force && isDirtyRef.current) return;
      setExistingLogs(existingLogs);
      setHwByStudent(homework);
    },
    [profile?.academy_id, classId, date, studentIds, studentIdsKey]
  );

  useEffect(() => {
    if (tab === 'daily') void loadDayLogs();
  }, [tab, loadDayLogs]);

  const visibleStudents = useMemo(() => {
    if (!missingOnly) return classStudents;
    return classStudents.filter(
      (s) => hwByStudent[s.id] === 'missing' || hwByStudent[s.id] === 'partial'
    );
  }, [classStudents, missingOnly, hwByStudent]);

  const missingCount = classStudents.filter((s) => hwByStudent[s.id] === 'missing').length;

  const handleDailySave = async () => {
    if (!profile?.academy_id || !profile.id || !classId) return;
    setSaving(true);
    setError('');
    const rows: LessonLogInsert[] = classStudents.map((st) => {
      const prev = existingLogs.get(st.id);
      return {
        academy_id: profile.academy_id!,
        class_id: classId,
        student_id: st.id,
        teacher_id: profile.id,
        lesson_date: date,
        unit: prev?.unit ?? '숙제 체크',
        attendance_status: prev?.attendance_status ?? 'present',
        homework_status: hwByStudent[st.id] ?? 'complete',
        test_score: prev?.test_score ?? null,
        tags: prev?.tags ?? ['숙제'],
        memo: prev?.memo ?? null,
      };
    });
    const result = await upsertLogs(rows);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    isDirtyRef.current = false;
    bumpDataVersion();
    showToast('숙제 제출 상태가 저장되었습니다.');
    void loadDayLogs(true);
  };

  const handleCreateAssignment = async () => {
    if (!classId || !newTitle.trim()) {
      setError('반과 숙제 제목을 입력해 주세요.');
      return;
    }
    setSaving(true);
    const result = await createAssignment({
      class_id: classId,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      due_date: newDue,
      studentIds: classStudents.map((s) => s.id),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNewTitle('');
    setNewDesc('');
    showToast('숙제 과제가 등록되었습니다.');
  };

  const openAssignment = async (id: string) => {
    setSelectedAssignmentId(id);
    const { submissions, error: subErr } = await fetchSubmissions(id);
    if (subErr) {
      setError(subErr);
      return;
    }
    setSubmissionRows(
      submissions.map((s) => ({
        student_id: s.student_id,
        name: s.students?.name ?? '-',
        grade: s.students?.grade ?? '',
        status: s.status,
        memo: s.feedback_memo ?? '',
      }))
    );
  };

  const handleSaveSubmissions = async () => {
    const assignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;
    setSaving(true);
    const result = await saveSubmissions(
      assignment,
      submissionRows.map((r) => ({
        student_id: r.student_id,
        status: r.status,
        feedback_memo: r.memo || undefined,
      }))
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast('제출 상태가 저장되었습니다 (수업 기록과 연동됨).');
  };

  if (classesLoading || studentsLoading || hwLoading) return <PageLoader />;

  const classAssignments = assignments.filter((a) => a.class_id === classId);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title={STAFF_PAGES.homework.title} />
      <Toast message={toast} />

      <div className="flex gap-2 border-b border-[var(--app-border)]">
        {(
          [
            { key: 'daily' as const, label: '일일 제출 현황' },
            { key: 'assignments' as const, label: '숙제 과제 관리' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-[var(--app-ink-3)] hover:text-[var(--app-ink-2)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily' && <LessonLogsHintBanner context="일일 숙제" />}

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="app-label mb-1">반</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm min-w-[160px]"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
        </label>
        {tab === 'daily' && (
          <label className="text-sm">
            <span className="app-label mb-1">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
            />
          </label>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {tab === 'daily' ? (
        <div className="app-card overflow-hidden">
          <div
            className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--app-border)]"
            style={{ background: 'var(--app-surface-2)' }}
          >
            <p className="text-sm text-[var(--app-ink-2)]">
              미제출 <strong className="text-red-600">{missingCount}</strong>명
            </p>
            <label className="flex items-center gap-2 text-sm text-[var(--app-ink-2)] ml-auto">
              <input
                type="checkbox"
                checked={missingOnly}
                onChange={(e) => setMissingOnly(e.target.checked)}
              />
              미제출·부분만 보기
            </label>
            <button
              type="button"
              onClick={handleDailySave}
              disabled={saving}
              className="app-btn app-btn-primary text-sm"
            >
              저장
            </button>
          </div>
          <ul className="divide-y divide-[var(--app-border)]">
            {visibleStudents.map((st) => {
              const current = hwByStudent[st.id] ?? 'complete';
              return (
                <li key={st.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="font-semibold text-[var(--app-ink)] min-w-[100px]">
                    {st.name}
                    <span className="text-[var(--app-ink-4)] text-xs ml-1">{st.grade}</span>
                  </span>
                  <div className="flex gap-1.5">
                    {homeworkOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          isDirtyRef.current = true;
                          setHwByStudent((prev) => ({ ...prev, [st.id]: opt.value }));
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold border',
                          current === opt.value ? opt.style : 'bg-[var(--app-surface)] text-[var(--app-ink-3)] border-[var(--app-border)]'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-[var(--app-ink-4)] ml-auto">{HOMEWORK_LABELS[current]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="app-card p-4 space-y-3">
            <h2 className="font-bold text-[var(--app-ink)]">새 숙제 등록</h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="숙제 제목"
              className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
              rows={2}
              className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
            />
            <label className="block text-sm">
              마감일
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleCreateAssignment}
              disabled={saving}
              className="w-full app-btn app-btn-primary"
            >
              반 전체에 숙제 등록
            </button>
          </div>
          <div className="app-card p-4">
            <h2 className="font-bold text-[var(--app-ink)] mb-3">숙제 목록</h2>
            {classAssignments.length === 0 ? (
              <p className="text-sm text-[var(--app-ink-3)]">등록된 숙제가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {classAssignments.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => openAssignment(a.id)}
                      className={cn(
                        'w-full text-left rounded-xl border px-3 py-2.5 text-sm hover:border-[var(--app-accent)]',
                        selectedAssignmentId === a.id && 'border-[var(--app-accent)] bg-[var(--app-accent-bg)]'
                      )}
                    >
                      <p className="font-semibold text-[var(--app-ink)]">{a.title}</p>
                      <p className="text-xs text-[var(--app-ink-3)] mt-0.5">마감 {a.due_date}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selectedAssignmentId && submissionRows.length > 0 && (
            <div className="lg:col-span-2 app-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
                <p className="font-semibold text-[var(--app-ink)]">학생별 제출 상태</p>
                <button
                  type="button"
                  onClick={handleSaveSubmissions}
                  disabled={saving}
                  className="app-btn app-btn-primary text-sm"
                >
                  저장 (수업 기록 연동)
                </button>
              </div>
              <ul className="divide-y divide-[var(--app-border)]">
                {submissionRows.map((row, idx) => (
                  <li key={row.student_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="font-medium text-[var(--app-ink)] w-28">{row.name}</span>
                    <div className="flex gap-1">
                      {homeworkOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const next = [...submissionRows];
                            next[idx] = { ...row, status: opt.value };
                            setSubmissionRows(next);
                          }}
                          className={cn(
                            'px-2 py-1 rounded-full text-xs border',
                            row.status === opt.value ? opt.style : 'border-[var(--app-border)] text-[var(--app-ink-3)]'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={row.memo}
                      onChange={(e) => {
                        const next = [...submissionRows];
                        next[idx] = { ...row, memo: e.target.value };
                        setSubmissionRows(next);
                      }}
                      placeholder="피드백 메모"
                      className="flex-1 min-w-[120px] rounded-lg border border-[var(--app-border)] px-2 py-1 text-xs"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--app-ink-3)]">
        숙제 상태는 <Link href="/lesson-logs" className="text-[var(--app-accent)] hover:underline">수업 기록</Link>
        과 동일한 데이터입니다. 상담·학생 분석에 자동 반영됩니다.
      </p>
    </div>
  );
}

export default function HomeworkPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HomeworkPageContent />
    </Suspense>
  );
}
