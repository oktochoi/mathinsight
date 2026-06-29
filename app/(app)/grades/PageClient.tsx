'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useClasses } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { useExams } from '@/hooks/useExams';
import { calculateScoreTrend } from '@/lib/analytics';
import { loadClassScorePoints } from '@/lib/lessonOperationalRead';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';
import type { ExamScore } from '@/types/database';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function GradesPage() {
  const { classes, loading: classesLoading } = useClasses();
  const { students, loading: studentsLoading } = useStudents();
  const { exams, loading: examsLoading, createExam, fetchScores, saveScores } = useExams();

  const [classId, setClassId] = useState('');
  const [scorePoints, setScorePoints] = useState<
    { student_id: string; class_id: string; lesson_date: string; test_score: number }[]
  >([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [scores, setScores] = useState<ExamScore[]>([]);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [memoInputs, setMemoInputs] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(todayStr());
  const [newUnit, setNewUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    setScoresLoading(true);
    void loadClassScorePoints(classId).then((pts) => {
      if (!cancelled) {
        setScorePoints(pts);
        setScoresLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const classStudents = useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId]
  );

  const classExams = useMemo(
    () => exams.filter((e) => e.class_id === classId),
    [exams, classId]
  );

  const logsByStudent = useMemo(() => {
    const m = new Map<string, typeof scorePoints>();
    for (const log of scorePoints) {
      const arr = m.get(log.student_id) ?? [];
      arr.push(log);
      m.set(log.student_id, arr);
    }
    return m;
  }, [scorePoints]);

  const decliningStudents = useMemo(() => {
    return classStudents
      .map((st) => {
        const trend = calculateScoreTrend(
          (logsByStudent.get(st.id) ?? []) as import('@/types/database').LessonLog[]
        );
        return { student: st, trend };
      })
      .filter((x) => x.trend.direction === 'down')
      .slice(0, 8);
  }, [classStudents, logsByStudent]);

  const openExam = async (examId: string) => {
    setSelectedExamId(examId);
    const { scores: loaded, error: err } = await fetchScores(examId);
    if (err) {
      setError(err);
      return;
    }
    setScores(loaded);
    const sc: Record<string, string> = {};
    const mem: Record<string, string> = {};
    for (const row of loaded) {
      sc[row.student_id] = row.score != null ? String(row.score) : '';
      mem[row.student_id] = row.feedback_memo ?? '';
    }
    for (const st of classStudents) {
      if (!sc[st.id]) sc[st.id] = '';
      if (!mem[st.id]) mem[st.id] = '';
    }
    setScoreInputs(sc);
    setMemoInputs(mem);
  };

  const examAvg = useMemo(() => {
    const vals = Object.values(scoreInputs)
      .map((v) => parseInt(v, 10))
      .filter((n) => !Number.isNaN(n));
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [scoreInputs]);

  const handleCreateExam = async () => {
    if (!classId || !newName.trim()) {
      setError('반과 시험명을 입력해 주세요.');
      return;
    }
    setSaving(true);
    const result = await createExam({
      class_id: classId,
      name: newName.trim(),
      exam_date: newDate,
      unit_scope: newUnit.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNewName('');
    setNewUnit('');
    setToast('시험이 등록되었습니다.');
    if (result.examId) openExam(result.examId);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSaveScores = async () => {
    if (!selectedExamId) return;
    setSaving(true);
    const rows = classStudents.map((st) => ({
      student_id: st.id,
      score: scoreInputs[st.id]?.trim() ? parseInt(scoreInputs[st.id], 10) : null,
      feedback_memo: memoInputs[st.id]?.trim() || undefined,
    }));
    const result = await saveScores(selectedExamId, rows);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setToast('점수가 저장되었습니다.');
    setTimeout(() => setToast(''), 2500);
    openExam(selectedExamId);
  };

  if (classesLoading || studentsLoading || examsLoading || scoresLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title={STAFF_PAGES.grades.title} />

      <label className="text-sm block max-w-xs">
        <span className="app-label">반 선택</span>
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSelectedExamId(null);
          }}
          className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
          style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.grade})
            </option>
          ))}
        </select>
      </label>

      {error && <ErrorBanner message={error} />}
      {toast && (
        <p className="text-sm rounded-xl px-3 py-2" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#065f46' }}>
          {toast}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="app-card p-4 space-y-3">
          <h2 className="font-bold" style={{ color: 'var(--app-ink)' }}>시험 등록</h2>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="시험명 (예: 3월 내신 대비)"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            placeholder="단원/범위"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <button
            type="button"
            onClick={handleCreateExam}
            disabled={saving}
            className="w-full app-btn app-btn-primary disabled:opacity-50"
          >
            시험 만들기
          </button>
        </div>

        <div className="app-card p-4">
          <h2 className="font-bold mb-3" style={{ color: 'var(--app-ink)' }}>시험 목록</h2>
          {classExams.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>등록된 시험이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {classExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    onClick={() => openExam(exam.id)}
                    className={cn('w-full text-left rounded-xl px-3 py-2.5 transition-all cursor-pointer')}
                    style={
                      selectedExamId === exam.id
                        ? { border: '1px solid var(--app-accent)', background: 'var(--app-accent-bg)' }
                        : { border: '1px solid var(--app-border)', background: 'transparent' }
                    }
                  >
                    <p className="font-semibold text-sm" style={{ color: 'var(--app-ink)' }}>{exam.name}</p>
                    <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                      {exam.exam_date}
                      {exam.unit_scope ? ` · ${exam.unit_scope}` : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <h2 className="font-bold text-sm" style={{ color: '#92400e' }}>점수 하락 감지</h2>
          <p className="text-xs mt-1" style={{ color: '#92400e', opacity: 0.8 }}>수업 기록 기준 · 학생 현황 연동</p>
          {decliningStudents.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: 'var(--app-ink-2)' }}>하락 추세 학생 없음</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {decliningStudents.map(({ student, trend }) => (
                <li key={student.id}>
                  <Link
                    href={`/students/${student.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--app-ink)' }}
                  >
                    {student.name}
                    <span className="ml-1 text-xs" style={{ color: '#dc2626' }}>
                      {trend.delta}점
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedExamId && (
        <div className="app-card overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
          >
            <div>
              <p className="font-bold" style={{ color: 'var(--app-ink)' }}>점수 입력</p>
              {examAvg != null && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-2)' }}>
                  반 평균 <strong style={{ color: 'var(--app-accent)' }}>{examAvg}점</strong>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSaveScores}
              disabled={saving}
              className="app-btn app-btn-primary disabled:opacity-50"
            >
              점수 저장
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ borderBottom: '1px solid var(--app-border)', color: 'var(--app-ink-3)' }}>
                  <th className="px-4 py-3 font-medium">학생</th>
                  <th className="px-4 py-3 font-medium w-24">점수</th>
                  <th className="px-4 py-3 font-medium">피드백</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--app-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--app-ink)' }}>
                      {st.name}
                      <span className="text-xs ml-1" style={{ color: 'var(--app-ink-4)' }}>{st.grade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scoreInputs[st.id] ?? ''}
                        onChange={(e) =>
                          setScoreInputs((prev) => ({ ...prev, [st.id]: e.target.value }))
                        }
                        className="w-20 rounded-lg px-2 py-1 text-sm"
                        style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={memoInputs[st.id] ?? ''}
                        onChange={(e) =>
                          setMemoInputs((prev) => ({ ...prev, [st.id]: e.target.value }))
                        }
                        placeholder="피드백 메모"
                        className="w-full min-w-[160px] rounded-lg px-2 py-1 text-sm"
                        style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
