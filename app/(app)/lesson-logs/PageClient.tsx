'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useClassStudentIds } from '@/hooks/useClassStudentIds';
import { useClasses } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { loadTodayLessonRows, useTodayLesson } from '@/hooks/useTodayLesson';
import { useLessonRowSave } from '@/hooks/useLessonRowSave';
import { EMPTY_LESSON_FORM_ROW, mergeLessonFormRow, type LessonFormRow } from '@/lib/lessonLogRowDefaults';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import { WorkspaceSection } from '@/components/lesson-logs/WorkspaceSection';
import { cn } from '@/lib/cn';
import type { AttendanceStatus, HomeworkStatus, Student } from '@/types/database';

const LESSON_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  scheduled: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: '수업 예정' },
  in_progress: { bg: '#f0fdf4', text: '#065f46', border: '#a7f3d0', label: '진행 중' },
  closed: { bg: 'var(--app-surface-2)', text: 'var(--app-ink-3)', border: 'var(--app-border)', label: '마감' },
};

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
};

const ATTENDANCE_STYLE: Record<AttendanceStatus, { bg: string; color: string }> = {
  present: { bg: '#f0fdf4', color: '#065f46' },
  late: { bg: '#fffbeb', color: '#92400e' },
  absent: { bg: '#fef2f2', color: '#b91c1c' },
};

const HOMEWORK_LABEL: Record<HomeworkStatus, string> = {
  complete: '완료',
  partial: '부분',
  missing: '미제출',
};

const HOMEWORK_STYLE: Record<HomeworkStatus, { bg: string; color: string }> = {
  complete: { bg: '#f0fdf4', color: '#065f46' },
  partial: { bg: '#fffbeb', color: '#92400e' },
  missing: { bg: '#fef2f2', color: '#b91c1c' },
};

const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: '출석' },
  { value: 'late', label: '지각' },
  { value: 'absent', label: '결석' },
];

const homeworkOptions: { value: HomeworkStatus; label: string }[] = [
  { value: 'complete', label: '완료' },
  { value: 'partial', label: '부분' },
  { value: 'missing', label: '미제출' },
];

function formatLessonTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

/** 학생별 이름 + 상태 태그 */
function StudentRowLabel({
  student,
  row,
  saving,
}: {
  student: Student;
  row: LessonFormRow;
  saving?: boolean;
}) {
  const isAbsent = row.attendance === 'absent';
  const isLate = row.attendance === 'late';
  return (
    <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[140px]">
      <p
        className="text-sm font-semibold truncate"
        style={{ color: isAbsent ? '#b91c1c' : 'var(--app-ink)', letterSpacing: '-0.01em' }}
      >
        {student.name}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        {saving && (
          <span className="text-[10px] animate-pulse" style={{ color: 'var(--app-ink-4)' }}>…</span>
        )}
        {(isAbsent || isLate) && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={ATTENDANCE_STYLE[row.attendance]}
          >
            {ATTENDANCE_LABEL[row.attendance]}
          </span>
        )}
      </div>
    </div>
  );
}

/** 기록 현황 요약 — 현재 입력 상태를 한눈에 */
function RecordingSummary({
  students,
  rows,
}: {
  students: Student[];
  rows: Record<string, LessonFormRow>;
}) {
  const total = students.length;
  const present = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'present').length;
  const late = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'late').length;
  const absent = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'absent').length;
  const hwDone = students.filter((s) => mergeLessonFormRow(rows[s.id]).homework === 'complete').length;
  const hwMissing = students.filter((s) => mergeLessonFormRow(rows[s.id]).homework === 'missing').length;
  const scored = students.filter((s) => {
    const v = mergeLessonFormRow(rows[s.id]).score;
    return v !== '' && v != null;
  }).length;

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm"
      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide mr-1" style={{ color: 'var(--app-ink-4)' }}>
        현황
      </span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        출석 <strong style={{ color: '#0284c7' }}>{present}</strong>
        {late > 0 && <> · 지각 <strong style={{ color: '#d97706' }}>{late}</strong></>}
        {absent > 0 && <> · 결석 <strong style={{ color: '#dc2626' }}>{absent}</strong></>}
      </span>
      <span style={{ color: 'var(--app-border)' }}>·</span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        숙제완료 <strong style={{ color: '#059669' }}>{hwDone}</strong>
        {hwMissing > 0 && <> · 미제출 <strong style={{ color: '#dc2626' }}>{hwMissing}</strong></>}
      </span>
      <span style={{ color: 'var(--app-border)' }}>·</span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        점수 <strong style={{ color: 'var(--app-ink)' }}>{scored}</strong>/{total}명
      </span>
    </div>
  );
}

/** 전체 학생 상태 요약 테이블 (step 01) */
function StudentStatusTable({
  students,
  rows,
}: {
  students: Student[];
  rows: Record<string, LessonFormRow>;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {['이름', '출결', '숙제', '점수'].map((h, i) => (
              <th
                key={h}
                className={cn(
                  'py-1.5 text-[11px] font-semibold',
                  i === 0 ? 'text-left' : i === 3 ? 'text-right' : 'text-center'
                )}
                style={{ color: 'var(--app-ink-4)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const row = mergeLessonFormRow(rows[student.id]);
            const attStyle = ATTENDANCE_STYLE[row.attendance];
            const hwStyle = HOMEWORK_STYLE[row.homework];
            return (
              <tr key={student.id} style={{ borderTop: '1px solid var(--app-border)' }}>
                <td className="py-2 font-medium" style={{ color: 'var(--app-ink)' }}>
                  {student.name}
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: attStyle.bg, color: attStyle.color }}
                  >
                    {ATTENDANCE_LABEL[row.attendance]}
                  </span>
                </td>
                <td className="py-2 text-center">
                  <span
                    className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: hwStyle.bg, color: hwStyle.color }}
                  >
                    {HOMEWORK_LABEL[row.homework]}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums" style={{ color: row.score ? 'var(--app-ink)' : 'var(--app-ink-4)' }}>
                  {row.score ? `${row.score}점` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LessonLogPageContent() {
  const searchParams = useSearchParams();
  const classFromUrl = searchParams.get('class');
  const dateFromUrl = searchParams.get('date');
  const { profile } = useAuth();
  const { classes, loading: classesLoading, error: classesError } = useClasses();
  const { students, loading: studentsLoading } = useStudents();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(dateFromUrl ?? new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<string, LessonFormRow>>({});
  const [homeworkNote, setHomeworkNote] = useState('');
  const [lastHomework, setLastHomework] = useState<{ title: string; date: string } | null>(null);
  const isDirtyRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const {
    lesson,
    loading: lessonLoading,
    closeLesson,
    startLesson,
    reopenLesson,
    refetch: refetchLesson,
  } = useTodayLesson(selectedClassId, date);

  const { classStudents, studentIds, studentIdsKey } = useClassStudentIds(students, selectedClassId);
  const { saveRow, saving: autoSaving } = useLessonRowSave(lesson?.id ?? null, selectedClassId, date, unit);

  const lessonStatus = lesson?.status ?? null;
  const lessonScheduled = lessonStatus === 'scheduled';
  const lessonInProgress = lessonStatus === 'in_progress';
  const lessonClosed = lessonStatus === 'closed';
  const formDisabled = lessonScheduled || lessonClosed;
  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (classFromUrl && classes.some((c) => c.id === classFromUrl)) {
      setSelectedClassId(classFromUrl);
      return;
    }
    if (!selectedClassId && classes[0]) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId, classFromUrl]);

  useEffect(() => {
    if (dateFromUrl) setDate(dateFromUrl);
  }, [dateFromUrl]);

  useEffect(() => {
    isDirtyRef.current = false;
    setHomeworkNote('');
    setLastHomework(null);
    setUnit('');
  }, [selectedClassId, date, studentIdsKey]);

  useEffect(() => {
    if (!selectedClassId || !date) return;
    void (async () => {
      const [todayHw, prevHw, progress] = await Promise.all([
        supabase
          .from('homework_assignments')
          .select('title')
          .eq('class_id', selectedClassId)
          .eq('lesson_date', date)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('homework_assignments')
          .select('title, lesson_date')
          .eq('class_id', selectedClassId)
          .lt('lesson_date', date)
          .order('lesson_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('class_progress')
          .select('unit_name')
          .eq('class_id', selectedClassId)
          .maybeSingle(),
      ]);
      if (todayHw.data) setHomeworkNote((todayHw.data as { title: string }).title);
      if (prevHw.data) {
        const row = prevHw.data as { title: string; lesson_date: string };
        setLastHomework({ title: row.title, date: row.lesson_date });
      }
      if (progress.data && !unit) {
        setUnit((progress.data as { unit_name: string }).unit_name);
      }
    })();
  }, [selectedClassId, date]);

  const reloadRows = useCallback(
    async (force = false) => {
      if (!selectedClassId || !studentIdsKey) return;
      const loaded = await loadTodayLessonRows(selectedClassId, date, studentIds);
      if (!force && isDirtyRef.current) return;
      const next: Record<string, LessonFormRow> = {};
      for (const sid of studentIds) {
        const row = loaded[sid];
        next[sid] = row
          ? mergeLessonFormRow({
              attendance: row.attendance,
              homework: row.homework,
              score: row.score,
              tags: row.tags,
              note: row.note,
            })
          : { ...EMPTY_LESSON_FORM_ROW };
      }
      setRows(next);
    },
    [selectedClassId, date, studentIds, studentIdsKey]
  );

  useEffect(() => { void reloadRows(); }, [reloadRows]);
  useEffect(() => {
    if (lesson?.unit && !unit) setUnit(lesson.unit);
  }, [lesson?.unit, lesson?.id, unit]);

  const updateRow = (
    studentId: string,
    field: keyof LessonFormRow,
    value: LessonFormRow[keyof LessonFormRow]
  ) => {
    if (formDisabled) return;
    isDirtyRef.current = true;
    const updated = { ...mergeLessonFormRow(rows[studentId]), [field]: value };
    setRows((prev) => ({ ...prev, [studentId]: updated }));
    saveRow(studentId, updated);
  };

  const markAllPresent = () => {
    if (formDisabled) return;
    isDirtyRef.current = true;
    setRows((prev) => {
      const next = { ...prev };
      for (const student of classStudents) {
        const updated = { ...mergeLessonFormRow(prev[student.id]), attendance: 'present' as const };
        next[student.id] = updated;
        saveRow(student.id, updated);
      }
      return next;
    });
    showToast('전원 출석으로 표시했습니다.');
  };

  const markAllHomeworkComplete = () => {
    if (formDisabled) return;
    isDirtyRef.current = true;
    setRows((prev) => {
      const next = { ...prev };
      for (const student of classStudents) {
        const updated = { ...mergeLessonFormRow(prev[student.id]), homework: 'complete' as const };
        next[student.id] = updated;
        saveRow(student.id, updated);
      }
      return next;
    });
    showToast('전원 숙제 완료로 표시했습니다.');
  };

  const loadClassProgress = async () => {
    if (!selectedClassId) return;
    const { data } = await supabase
      .from('class_progress')
      .select('unit_name')
      .eq('class_id', selectedClassId)
      .maybeSingle();
    if (!data) {
      showToast('등록된 진도가 없습니다. 진도 관리에서 먼저 설정해 주세요.');
      return;
    }
    setUnit((data as { unit_name: string }).unit_name);
    showToast('진도를 불러왔습니다.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStartLesson = async () => {
    setStarting(true);
    setError('');
    if (!lesson) {
      if (!profile?.academy_id || !profile.id) {
        setError('로그인 정보가 없습니다.');
        setStarting(false);
        return;
      }
      const { error: insertErr } = await supabase.from('lessons').insert({
        academy_id: profile.academy_id,
        class_id: selectedClassId,
        lesson_date: date,
        teacher_id: profile.id,
        unit: unit.trim() || '미입력',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        started_by: profile.id,
        lesson_type: 'regular',
      });
      if (insertErr) {
        setError(insertErr.message);
        setStarting(false);
        return;
      }
    } else {
      const result = await startLesson();
      if (result.error) {
        setError(result.error);
        setStarting(false);
        return;
      }
    }
    setStarting(false);
    await refetchLesson();
    showToast('수업을 시작했습니다.');
  };

  const handleCloseLesson = async () => {
    setClosing(true);
    const result = await closeLesson();
    setClosing(false);
    if (result.error) setError(result.error);
    else showToast('수업이 마감되었습니다.');
  };

  const handleReopenLesson = async () => {
    setReopening(true);
    const result = await reopenLesson();
    setReopening(false);
    if (result.error) setError(result.error);
    else showToast('수업이 다시 열렸습니다.');
  };

  const handleSaveHeader = async () => {
    if (!selectedClassId || !profile?.academy_id || !profile.id) return;
    setSavingHeader(true);
    setError('');
    if (lesson?.id) {
      await supabase.from('lessons').update({ unit: unit.trim() || '미입력' }).eq('id', lesson.id);
    }
    if (homeworkNote.trim() && profile.academy_id) {
      const { data: existing } = await supabase
        .from('homework_assignments')
        .select('id')
        .eq('class_id', selectedClassId)
        .eq('lesson_date', date)
        .maybeSingle();
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 7);
      if ((existing as { id?: string } | null)?.id) {
        await supabase
          .from('homework_assignments')
          .update({ title: homeworkNote.trim(), unit: unit || null })
          .eq('id', (existing as { id: string }).id);
      } else {
        await supabase.from('homework_assignments').insert({
          academy_id: profile.academy_id,
          class_id: selectedClassId,
          title: homeworkNote.trim(),
          due_date: dueDate.toISOString().slice(0, 10),
          lesson_date: date,
          unit: unit || null,
          created_by: profile.id,
        });
      }
    }
    setSavingHeader(false);
    showToast('저장되었습니다.');
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  if (classesLoading || studentsLoading) return <PageLoader />;

  const statusStyle = lessonStatus
    ? (LESSON_STATUS_STYLE[lessonStatus] ?? LESSON_STATUS_STYLE.closed)
    : null;

  const inputStyle = (disabled: boolean) => ({
    background: 'var(--app-surface-2)',
    border: '1px solid var(--app-border)',
    color: disabled ? 'var(--app-ink-4)' : 'var(--app-ink)',
    outline: 'none' as const,
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto pb-16 space-y-6">
      {toast && <div className="toast-fixed bg-emerald-600">{toast}</div>}
      {error && <ErrorBanner message={error} />}
      {classesError && <ErrorBanner message={classesError} />}

      {/* ── 상단: 수업 정보 헤더 ── */}
      <header
        className="rounded-2xl px-6 py-6"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--s-sm)',
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--app-ink-4)' }}
        >
          오늘 수업
        </p>

        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm min-h-[40px] flex-1 min-w-[140px]"
            style={inputStyle(false)}
            aria-label="반 선택"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={inputStyle(false)}
            aria-label="날짜"
          />
        </div>

        {selectedClassId && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
                >
                  {selectedClass?.name ?? '반'}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--app-ink-3)' }}>
                  <span className="tabular-nums">{date}</span>
                  <span>학생 {classStudents.length}명</span>
                  <span>시작 {formatLessonTime(lesson?.started_at)}</span>
                  <span>강사 {profile?.name ?? '—'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {lessonLoading ? (
                  <span className="text-xs" style={{ color: 'var(--app-ink-4)' }}>불러오는 중…</span>
                ) : statusStyle ? (
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                    style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                  >
                    {statusStyle.label}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--app-ink-4)' }}>수업 없음</span>
                )}

                {(!lesson || lessonScheduled) && !lessonClosed && (
                  <button
                    type="button"
                    disabled={starting}
                    onClick={() => void handleStartLesson()}
                    className="app-btn app-btn-primary disabled:opacity-50"
                  >
                    {starting ? '시작 중…' : '수업 시작'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--app-border)' }}>
              <div className="flex flex-wrap items-end justify-between gap-2 mb-1.5">
                <label className="app-label">오늘 단원</label>
                {!lessonClosed && (
                  <button
                    type="button"
                    onClick={() => void loadClassProgress()}
                    className="app-btn app-btn-ghost app-btn-sm"
                  >
                    진도 불러오기
                  </button>
                )}
              </div>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={lessonClosed}
                placeholder="예: 삼각함수 3단원"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle(lessonClosed)}
              />
            </div>
          </>
        )}
      </header>

      {/* 상태 배너 */}
      {lessonScheduled && (
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <i className="ri-information-line text-lg mt-0.5" style={{ color: '#d97706' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>수업을 먼저 시작해 주세요.</p>
            <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
              수업을 시작하면 출결·숙제·점수를 기록할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {!lesson && !lessonLoading && selectedClassId && (
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
        >
          <i className="ri-calendar-line text-lg mt-0.5" style={{ color: 'var(--app-ink-4)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--app-ink-2)' }}>이 날짜에 수업이 없습니다.</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
              상단 「수업 시작」으로 수업을 생성하고 시작할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {classStudents.length === 0 && selectedClassId && (
        <div
          className="rounded-2xl px-5 py-8 text-center text-sm"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-ink-3)' }}
        >
          선택한 반에 학생이 없습니다. 학생 관리에서 반을 지정해 주세요.
        </div>
      )}

      {classStudents.length > 0 && (
        <div className="space-y-5" style={{ opacity: formDisabled ? 0.85 : 1 }}>
          {/* 기록 현황 요약 바 */}
          <RecordingSummary students={classStudents} rows={rows} />

          {/* ── 01 학생 현황 ── */}
          <WorkspaceSection
            step="01"
            title="학생 현황"
            description={`${classStudents.length}명 — 기록 상태를 한눈에 확인`}
          >
            <StudentStatusTable students={classStudents} rows={rows} />
          </WorkspaceSection>

          {/* ── 02 출결 ── */}
          <WorkspaceSection step="02" title="출결" description="학생별 출석 상태를 선택합니다">
            {!formDisabled && (
              <div className="mb-3 flex gap-2">
                <button type="button" onClick={markAllPresent} className="app-btn app-btn-secondary app-btn-sm">
                  <i className="ri-checkbox-multiple-line" />
                  전원 출석
                </button>
              </div>
            )}
            <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
              {classStudents.map((student) => {
                const row = mergeLessonFormRow(rows[student.id]);
                return (
                  <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <StudentRowLabel student={student} row={row} saving={autoSaving[student.id]} />
                    <div className="flex gap-1">
                      {attendanceOptions.map((o) => {
                        const active = row.attendance === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            disabled={formDisabled}
                            onClick={() => updateRow(student.id, 'attendance', o.value)}
                            className={cn('app-btn app-btn-sm', active ? 'app-btn-primary' : 'app-btn-secondary')}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </WorkspaceSection>

          {/* ── 03 숙제 ── */}
          <WorkspaceSection
            step="03"
            title="숙제"
            description="지난 과제 확인 · 오늘 과제 등록"
          >
            <div className="space-y-4">
              {lastHomework && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--app-ink-4)' }}>
                    지난 숙제 ({lastHomework.date})
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--app-ink)' }}>
                    {lastHomework.title}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--app-ink-3)' }}>
                    아래에서 학생별 제출 여부를 체크하세요.
                  </p>
                </div>
              )}

              {!formDisabled && (
                <div className="flex gap-2">
                  <button type="button" onClick={markAllHomeworkComplete} className="app-btn app-btn-secondary app-btn-sm">
                    <i className="ri-checkbox-multiple-line" />
                    전원 완료
                  </button>
                </div>
              )}

              <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
                {classStudents.map((student) => {
                  const row = mergeLessonFormRow(rows[student.id]);
                  return (
                    <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <StudentRowLabel student={student} row={row} />
                      <div className="flex gap-1">
                        {homeworkOptions.map((o) => {
                          const active = row.homework === o.value;
                          return (
                            <button
                              key={o.value}
                              type="button"
                              disabled={formDisabled}
                              onClick={() => updateRow(student.id, 'homework', o.value)}
                              className={cn('app-btn app-btn-sm', active ? 'app-btn-primary' : 'app-btn-secondary')}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--app-border)' }}>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-1.5">
                  <label className="app-label">
                    <i className="ri-book-2-line mr-1" />
                    오늘 내줄 숙제
                  </label>
                  {!lessonClosed && (
                    <button
                      type="button"
                      onClick={() => void handleSaveHeader()}
                      disabled={savingHeader}
                      className="app-btn app-btn-ghost text-xs disabled:opacity-50"
                    >
                      {savingHeader ? '저장 중…' : '과제 저장'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={homeworkNote}
                  disabled={lessonClosed}
                  onChange={(e) => setHomeworkNote(e.target.value)}
                  placeholder="예: p.45 예제 1~10번"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle(lessonClosed)}
                />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--app-ink-4)' }}>
                  저장 시 학부모·학생 포털에 표시됩니다.
                </p>
              </div>
            </div>
          </WorkspaceSection>

          {/* ── 04 점수 ── */}
          <WorkspaceSection step="04" title="점수" description="오늘 평가 점수를 입력합니다">
            <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
              {classStudents.map((student) => {
                const row = mergeLessonFormRow(rows[student.id]);
                return (
                  <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <StudentRowLabel student={student} row={row} />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={formDisabled}
                        value={row.score}
                        onChange={(e) => updateRow(student.id, 'score', e.target.value)}
                        className="w-20 px-3 py-2 rounded-xl text-sm text-right tabular-nums"
                        style={inputStyle(formDisabled)}
                        placeholder="—"
                        aria-label={`${student.name} 점수`}
                      />
                      {row.score && (
                        <span className="text-xs" style={{ color: 'var(--app-ink-3)' }}>점</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </WorkspaceSection>

          {/* ── 05 수업 메모 ── */}
          <WorkspaceSection
            step="05"
            title="수업 메모"
            description="학생별로 필요한 내용만 간단히 기록합니다"
          >
            <ul className="space-y-4">
              {classStudents.map((student) => {
                const row = mergeLessonFormRow(rows[student.id]);
                return (
                  <li
                    key={student.id}
                    className="pb-4 last:pb-0 border-b last:border-0"
                    style={{ borderColor: 'var(--app-border)' }}
                  >
                    <StudentRowLabel student={student} row={row} saving={autoSaving[student.id]} />
                    <input
                      placeholder="메모 (선택)"
                      disabled={formDisabled}
                      value={row.note}
                      onChange={(e) => updateRow(student.id, 'note', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm mt-2"
                      style={inputStyle(formDisabled)}
                    />
                  </li>
                );
              })}
            </ul>
          </WorkspaceSection>

          {/* ── 06 수업 마감 ── */}
          <WorkspaceSection
            step="06"
            title="수업 마감"
            description="기록을 마친 뒤 수업을 마감합니다"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
                {lessonInProgress
                  ? '출결·숙제·점수·메모 입력이 끝나면 마감하세요.'
                  : lessonClosed
                    ? '수업이 마감되었습니다.'
                    : '수업을 시작한 뒤 기록을 입력할 수 있습니다.'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {lessonInProgress && (
                  <button
                    type="button"
                    disabled={closing}
                    onClick={() => void handleCloseLesson()}
                    className="app-btn disabled:opacity-50"
                    style={{ background: 'var(--app-ink)', color: '#fff', borderColor: 'transparent' }}
                  >
                    {closing ? '마감 중…' : '수업 마감'}
                  </button>
                )}
                {lessonClosed && isOwner && (
                  <button
                    type="button"
                    disabled={reopening}
                    onClick={() => void handleReopenLesson()}
                    className="app-btn app-btn-ghost disabled:opacity-50"
                  >
                    {reopening ? '열기 중…' : '다시 열기'}
                  </button>
                )}
              </div>
            </div>
          </WorkspaceSection>

          {/* ── 마감 후 다음 단계 ── */}
          {lessonClosed && (() => {
            const absentStudents = classStudents.filter(
              (s) => mergeLessonFormRow(rows[s.id]).attendance === 'absent'
            );
            const missingHomeworkStudents = classStudents.filter(
              (s) => mergeLessonFormRow(rows[s.id]).homework === 'missing'
            );
            return (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--app-ink-4)' }}>
                    수업 마감 완료
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                    다음 단계를 확인하세요.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      href: `/schedule?class=${selectedClassId}&date=${date}&action=makeup`,
                      icon: 'ri-calendar-check-line',
                      iconBg: '#fef9c3',
                      iconColor: '#a16207',
                      title: '결석자 보강',
                      desc: absentStudents.length > 0
                        ? `${absentStudents.map((s) => s.name).join(', ')} · ${absentStudents.length}명`
                        : '결석자 없음',
                    },
                    {
                      href: `/consultation-cards${selectedClassId ? `?class=${selectedClassId}` : ''}`,
                      icon: 'ri-chat-check-line',
                      iconBg: '#ede9fe',
                      iconColor: '#5b21b6',
                      title: '상담 카드 작성',
                      desc: 'AI 상담 준비 및 학부모 전달',
                    },
                    {
                      href: '/parent-reports',
                      icon: 'ri-file-text-line',
                      iconBg: '#ffedd5',
                      iconColor: '#c2410c',
                      title: '학부모 전달',
                      desc: missingHomeworkStudents.length > 0
                        ? `미제출 ${missingHomeworkStudents.length}명 포함 확인`
                        : '학부모 리포트 보내기',
                    },
                  ].map(({ href, icon, iconBg, iconColor, title, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-start gap-3 rounded-xl p-4 transition-all hover:shadow-[var(--s-md)]"
                      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
                    >
                      <span
                        className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: iconBg }}
                      >
                        <i className={cn(icon, 'text-base')} style={{ color: iconColor }} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function LessonLogPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LessonLogPageContent />
    </Suspense>
  );
}
