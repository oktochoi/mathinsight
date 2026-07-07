'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClassStudentIds } from '@/hooks/useClassStudentIds';
import { useClasses } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { useAppStore } from '@/store/useAppStore';
import { loadClassDayData } from '@/lib/lessonOperationalRead';
import { upsertAttendanceOnly } from '@/lib/lessonLogUpsert';
import { supabase } from '@/lib/supabase';
import { ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { notifyAttendancePushBatch } from '@/lib/push/notifyAttendanceClient';
import { useToast } from '@/hooks/useToast';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { LessonLogsHintBanner } from '@/components/staff/LessonLogsHintBanner';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';
import type { AttendanceStatus, LessonLog } from '@/types/database';

const attendanceOptions: { value: AttendanceStatus; label: string; style: string }[] = [
  { value: 'present', label: '출석', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'late', label: '지각', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'absent', label: '결석', style: 'bg-red-100 text-red-800 border-red-200' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const { classes, loading: classesLoading } = useClasses();
  const { students, loading: studentsLoading } = useStudents();

  const [date, setDate] = useState(searchParams.get('date') ?? todayStr());
  const [classId, setClassId] = useState(searchParams.get('class') ?? '');
  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});
  const [existingLogs, setExistingLogs] = useState<Map<string, LessonLog>>(new Map());
  const [absentOnly, setAbsentOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { message: toast, show: showToast } = useToast(2500);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  const { classStudents, studentIds, studentIdsKey } = useClassStudentIds(students, classId);

  useEffect(() => {
    isDirtyRef.current = false;
  }, [classId, date, studentIdsKey]);

  const loadDayLogs = useCallback(
    async (force = false) => {
      if (!profile?.academy_id || !classId || !studentIdsKey) return;
      if (!force && isDirtyRef.current) return;
      setLoadingLogs(true);
      const { existingLogs, attendance } = await loadClassDayData(
        profile.academy_id,
        classId,
        date,
        studentIds
      );
      if (!force && isDirtyRef.current) {
        setLoadingLogs(false);
        return;
      }
      setExistingLogs(existingLogs);
      setStatusByStudent(attendance);
      setLoadingLogs(false);
    },
    [profile?.academy_id, classId, date, studentIds, studentIdsKey]
  );

  useEffect(() => {
    void loadDayLogs();
  }, [loadDayLogs]);

  const summary = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const st of classStudents) {
      const s = statusByStudent[st.id] ?? 'present';
      if (s === 'present') present += 1;
      else if (s === 'late') late += 1;
      else absent += 1;
    }
    return { present, late, absent, makeup: absent };
  }, [classStudents, statusByStudent]);

  const visibleStudents = useMemo(() => {
    if (!absentOnly) return classStudents;
    return classStudents.filter((s) => statusByStudent[s.id] === 'absent');
  }, [classStudents, absentOnly, statusByStudent]);

  const handleSave = async () => {
    if (!profile?.academy_id || !profile.id || !classId) {
      setError('로그인·반 정보를 확인해 주세요.');
      return;
    }
    if (classStudents.length === 0) {
      setError('이 반에 학생이 없습니다.');
      return;
    }
    setSaving(true);
    setError('');
    const rows = classStudents.map((st) => ({
      academy_id: profile.academy_id!,
      class_id: classId,
      student_id: st.id,
      teacher_id: profile.id,
      lesson_date: date,
      attendance_status: statusByStudent[st.id] ?? 'present',
    }));
    const result = await upsertAttendanceOnly(supabase, rows, existingLogs);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    const selectedClass = classes.find((c) => c.id === classId);
    const changedItems = classStudents
      .map((st) => {
        const prev = existingLogs.get(st.id)?.attendance_status;
        const next = statusByStudent[st.id] ?? 'present';
        if (prev === next) return null;
        return { studentId: st.id, attendanceStatus: next };
      })
      .filter((item): item is { studentId: string; attendanceStatus: AttendanceStatus } => item != null);

    notifyAttendancePushBatch({
      lessonDate: date,
      classId,
      className: selectedClass?.name,
      items: changedItems,
    });

    isDirtyRef.current = false;
    bumpDataVersion();
    showToast('출결이 저장되었습니다.');
    void loadDayLogs(true);
  };

  if (classesLoading || studentsLoading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title={STAFF_PAGES.attendance.title} />
      <LessonLogsHintBanner context="출결" />
      <Toast message={toast} />

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="app-card overflow-hidden">
          <div
            className="flex flex-wrap items-end gap-3 p-4 border-b border-[var(--app-border)]"
            style={{ background: 'var(--app-surface-2)' }}
          >
            <label className="text-sm">
              <span className="app-label block mb-1">날짜</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm min-w-[160px]">
              <span className="app-label block mb-1">반</span>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--app-ink-2)] pb-2 ml-auto">
              <input
                type="checkbox"
                checked={absentOnly}
                onChange={(e) => setAbsentOnly(e.target.checked)}
                className="rounded"
              />
              결석·보강 필요만
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="app-btn app-btn-primary text-sm disabled:opacity-50 min-h-[44px]"
            >
              {saving ? '저장 중…' : '출결 저장'}
            </button>
          </div>

          {error && <ErrorBanner message={error} />}

          {loadingLogs ? (
            <p className="p-8 text-center text-sm text-[var(--app-ink-3)]">불러오는 중…</p>
          ) : visibleStudents.length === 0 ? (
            <p className="p-8 text-center text-sm text-[var(--app-ink-3)]">
              {absentOnly ? '결석 학생이 없습니다.' : '이 반에 등록된 학생이 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--app-border)]">
              {visibleStudents.map((st) => {
                const current = statusByStudent[st.id] ?? 'present';
                return (
                  <li key={st.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Link
                      href={`/students/${st.id}`}
                      className="min-w-[120px] font-semibold text-[var(--app-ink)] hover:text-[var(--app-accent)]"
                    >
                      {st.name}
                      <span className="text-[var(--app-ink-3)] font-normal text-xs ml-1">{st.grade}</span>
                    </Link>
                    <div className="flex flex-wrap gap-1.5">
                      {attendanceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            isDirtyRef.current = true;
                            setStatusByStudent((prev) => ({ ...prev, [st.id]: opt.value }));
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                            current === opt.value
                              ? opt.style
                              : 'bg-[var(--app-surface)] text-[var(--app-ink-3)] border-[var(--app-border)] hover:border-[var(--app-border)]'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {current === 'absent' && (
                      <span className="text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100">
                        보강 필요
                      </span>
                    )}
                    <span className="text-xs text-[var(--app-ink-3)] ml-auto">
                      {ATTENDANCE_LABELS[current]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-3">
          <div className="app-card p-4">
            <p className="text-xs font-semibold text-[var(--app-ink-3)]">오늘 출결 요약</p>
            <p className="text-2xl font-bold text-[var(--app-ink)] mt-2 tabular-nums">
              {classStudents.length}
              <span className="text-sm font-medium text-[var(--app-ink-3)] ml-1">명</span>
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-emerald-700">출석</span>
                <span className="font-semibold tabular-nums">{summary.present}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-amber-700">지각</span>
                <span className="font-semibold tabular-nums">{summary.late}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-red-700">결석</span>
                <span className="font-semibold tabular-nums">{summary.absent}</span>
              </li>
              <li className="flex justify-between border-t border-[var(--app-border)] pt-2">
                <span className="text-violet-700">보강 검토</span>
                <span className="font-semibold tabular-nums">{summary.makeup}</span>
              </li>
            </ul>
          </div>
          <div
            className="rounded-2xl p-4 text-xs leading-relaxed"
            style={{ background: 'var(--app-accent-bg)', border: '1px solid var(--app-accent)', color: 'var(--app-accent)' }}
          >
            결석 학생은 자동으로 「보강 필요」로 표시됩니다. 상담·리포트에도 출결 데이터가
            반영됩니다.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendancePageContent />
    </Suspense>
  );
}
