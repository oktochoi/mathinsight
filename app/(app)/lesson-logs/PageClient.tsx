'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClassStudentIds } from '@/hooks/useClassStudentIds';
import { useClasses } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { loadTodayLessonRows, useTodayLesson } from '@/hooks/useTodayLesson';
import { useLessonRowSave } from '@/hooks/useLessonRowSave';
import { useLessonPageData } from '@/hooks/useLessonPageData';
import { useLessonActions } from '@/hooks/useLessonActions';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import { EMPTY_LESSON_FORM_ROW, mergeLessonFormRow, type LessonFormRow } from '@/lib/lessonLogRowDefaults';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import {
  LESSON_STATUS_STYLE,
  attendanceOptions,
  homeworkOptions,
} from '@/components/lesson-logs/lessonLogConstants';
import { LessonLogHeader } from '@/components/lesson-logs/LessonLogHeader';
import { LessonStatusBanners } from '@/components/lesson-logs/LessonStatusBanners';
import { LessonRecordingSection } from '@/components/lesson-logs/LessonRecordingSection';

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
  const isDirtyRef = useRef(false);
  const [error, setError] = useState('');
  const { message: toast, show: showToast } = useToast();

  const {
    homeworkNote,
    setHomeworkNote,
    lastHomework,
    loadClassProgress: fetchClassProgress,
    resetForContext,
  } = useLessonPageData(selectedClassId, date);

  const {
    lesson,
    loading: lessonLoading,
    closeLesson,
    startLesson,
    createAndStartLesson,
    reopenLesson,
    refetch: refetchLesson,
  } = useTodayLesson(selectedClassId, date);

  const { classStudents, studentIds, studentIdsKey } = useClassStudentIds(students, selectedClassId);
  const { saveRow, saving: autoSaving } = useLessonRowSave(lesson?.id ?? null, selectedClassId, date, unit);

  const {
    handleStartLesson,
    handleSaveHeader,
    handleCloseLesson,
    handleReopenLesson,
    starting,
    savingHeader,
    closing,
    reopening,
  } = useLessonActions({
    selectedClassId,
    date,
    unit,
    homeworkNote,
    lesson,
    profile,
    startLesson,
    createAndStartLesson,
    refetchLesson,
    closeLesson,
    reopenLesson,
    showToast,
    setError,
  });

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
    resetForContext();
    setUnit('');
  }, [selectedClassId, date, studentIdsKey, resetForContext]);

  useEffect(() => {
    if (!selectedClassId) return;
    void fetchClassProgress().then((unitName) => {
      if (unitName) setUnit((prev) => prev || unitName);
    });
  }, [selectedClassId, date, fetchClassProgress]);

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

  useEffect(() => {
    void reloadRows();
  }, [reloadRows]);

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
    const unitName = await fetchClassProgress();
    if (!unitName) {
      showToast('등록된 진도가 없습니다. 진도 관리 → 반 선택 후 단원을 등록해 주세요.');
      return;
    }
    setUnit(unitName);
    showToast('진도를 불러왔습니다.');
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  if (classesLoading || studentsLoading) return <PageLoader />;

  const statusStyle = lessonStatus
    ? (LESSON_STATUS_STYLE[lessonStatus] ?? LESSON_STATUS_STYLE.closed)
    : null;

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto pb-16 space-y-6">
      <Toast message={toast} />
      {error && <ErrorBanner message={error} />}
      {classesError && <ErrorBanner message={classesError} />}

      <LessonLogHeader
        classes={classes}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        date={date}
        onDateChange={setDate}
        className={selectedClass?.name}
        studentCount={classStudents.length}
        teacherName={profile?.name ?? undefined}
        lessonLoading={lessonLoading}
        statusStyle={statusStyle}
        lessonScheduled={lessonScheduled}
        lessonClosed={lessonClosed}
        hasLesson={Boolean(lesson)}
        starting={starting}
        onStartLesson={() => void handleStartLesson()}
        unit={unit}
        onUnitChange={setUnit}
        onLoadProgress={() => void loadClassProgress()}
        startedAt={lesson?.started_at}
      />

      <LessonStatusBanners
        lessonScheduled={lessonScheduled}
        noLesson={!lesson && !lessonLoading}
        selectedClassId={selectedClassId}
        onStartLesson={() => void handleStartLesson()}
        starting={starting}
      />

      {classStudents.length === 0 && selectedClassId && (
        <div
          className="rounded-2xl px-5 py-8 text-center text-sm"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--app-ink-3)' }}
        >
          선택한 반에 학생이 없습니다. 학생 관리에서 반을 지정해 주세요.
        </div>
      )}

      {classStudents.length > 0 && (
        <LessonRecordingSection
          students={classStudents}
          rows={rows}
          formDisabled={formDisabled}
          lastHomework={lastHomework}
          homeworkNote={homeworkNote}
          onHomeworkNoteChange={setHomeworkNote}
          lessonClosed={lessonClosed}
          savingHeader={savingHeader}
          onSaveHeader={() => void handleSaveHeader()}
          onMarkAllPresent={markAllPresent}
          onMarkAllHomeworkComplete={markAllHomeworkComplete}
          onUpdateRow={updateRow}
          autoSaving={autoSaving}
          attendanceOptions={attendanceOptions}
          homeworkOptions={homeworkOptions}
          lessonInProgress={lessonInProgress}
          isOwner={isOwner}
          closing={closing}
          reopening={reopening}
          onCloseLesson={() => void handleCloseLesson()}
          onReopenLesson={() => void handleReopenLesson()}
          selectedClassId={selectedClassId}
          date={date}
        />
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
