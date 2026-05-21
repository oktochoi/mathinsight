'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useClasses, useLessonLogs } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import type { AttendanceStatus, HomeworkStatus, LessonLogInsert } from '@/types/database';

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

const quickTags = ['계산 실수', '개념 약함', '독해 느림', '참여 우수', '집중력 부족', '성실함'];

interface StudentRow {
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  score: string;
  tags: string[];
  note: string;
}

export default function LessonLogPage() {
  const { profile } = useAuth();
  const { classes, loading: classesLoading, error: classesError } = useClasses();
  const { students, loading: studentsLoading } = useStudents();
  const { batchInsert } = useLessonLogs();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<string, StudentRow>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const classStudents = useMemo(
    () => students.filter((s) => s.class_id === selectedClassId),
    [students, selectedClassId]
  );

  useEffect(() => {
    if (!selectedClassId && classes[0]) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);

  useEffect(() => {
    const initial: Record<string, StudentRow> = {};
    classStudents.forEach((s) => {
      initial[s.id] = rows[s.id] ?? {
        attendance: 'present',
        homework: 'complete',
        score: '',
        tags: [],
        note: '',
      };
    });
    setRows(initial);
  }, [classStudents.map((s) => s.id).join(',')]);

  const updateRow = (studentId: string, field: keyof StudentRow, value: StudentRow[keyof StudentRow]) => {
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const toggleTag = (studentId: string, tag: string) => {
    setRows((prev) => {
      const current = prev[studentId]?.tags ?? [];
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [studentId]: { ...prev[studentId], tags: next } };
    });
  };

  const handleSave = async () => {
    if (!profile?.academy_id || !profile.id) {
      setError('로그인 정보가 없습니다.');
      return;
    }
    if (!selectedClassId || !unit.trim()) {
      setError('반과 단원을 입력해 주세요.');
      return;
    }
    if (classStudents.length === 0) {
      setError('이 반에 등록된 학생이 없습니다.');
      return;
    }

    setSaving(true);
    setError('');
    const inserts: LessonLogInsert[] = classStudents.map((s) => {
      const row = rows[s.id];
      const score = row?.score?.trim() ? parseInt(row.score, 10) : null;
      return {
        academy_id: profile.academy_id!,
        class_id: selectedClassId,
        student_id: s.id,
        teacher_id: profile.id,
        lesson_date: date,
        unit: unit.trim(),
        attendance_status: row?.attendance ?? 'present',
        homework_status: row?.homework ?? 'complete',
        test_score: Number.isNaN(score as number) ? null : score,
        tags: row?.tags ?? [],
        memo: row?.note?.trim() || null,
      };
    });

    const { error: err } = await batchInsert(inserts);
    setSaving(false);
    if (err) setError(err);
    else {
      setToast('저장되었습니다. 대시보드·학생 상세에 반영됩니다.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (classesLoading || studentsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-8 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-emerald-600">
          {toast}
        </div>
      )}
      {error && <ErrorBanner message={error} />}
      {classesError && <ErrorBanner message={classesError} />}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lesson Log</h1>
          <p className="text-sm text-slate-500 mt-1">수업 기록을 일괄 저장합니다</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white border border-slate-200 flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">반</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm min-w-[140px]"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-500 block mb-1">단원 *</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="예: 삼각함수"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>

      {classStudents.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white border text-center text-sm text-slate-500">
          선택한 반에 학생이 없습니다. 학생 관리에서 반을 지정해 주세요.
        </div>
      ) : (
        <div className="space-y-4">
          {classStudents.map((student) => {
            const row = rows[student.id];
            if (!row) return null;
            return (
              <div key={student.id} className="rounded-2xl p-5 bg-white border border-slate-200">
                <p className="font-semibold text-sm mb-3">{student.name}</p>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">출결</span>
                    <div className="flex gap-1">
                      {attendanceOptions.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateRow(student.id, 'attendance', o.value)}
                          className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
                            row.attendance === o.value ? 'bg-slate-800 text-white' : 'bg-slate-100'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">숙제</span>
                    <div className="flex gap-1">
                      {homeworkOptions.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateRow(student.id, 'homework', o.value)}
                          className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
                            row.homework === o.value ? 'bg-blue-600 text-white' : 'bg-slate-100'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">점수</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.score}
                      onChange={(e) => updateRow(student.id, 'score', e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(student.id, tag)}
                      className={`px-2 py-1 rounded-lg text-xs border cursor-pointer ${
                        row.tags.includes(tag) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="메모"
                  value={row.note}
                  onChange={(e) => updateRow(student.id, 'note', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || classStudents.length === 0}
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 disabled:opacity-50 cursor-pointer"
      >
        {saving ? '저장 중...' : '일괄 저장'}
      </button>
    </div>
  );
}
