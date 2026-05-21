'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';
import type { Student, LessonLog } from '@/types/database';

export default function StudentPortalPage() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('students')
        .select('*, academies(id, name)')
        .eq('student_user_id', profile.id)
        .maybeSingle();
      if (err) setError('학생 정보를 불러오지 못했습니다.');
      else setStudent(data as Student);
      setLoading(false);
    })();
  }, [profile?.id]);

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: student?.id,
    limit: 20,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.lesson_date === today);
  const latestScore = logs.find((l) => l.test_score != null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} />;
  if (!student) {
    return (
      <EmptyState
        title="연결된 학생 프로필이 없습니다"
        description="학원에서 학생 계정을 연결해 주세요."
      />
    );
  }

  const feedback = generateLearningSummary(logs, student.name);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">안녕하세요, {student.name}님</h1>
        <p className="text-sm text-slate-500">
          {(student as Student & { academies?: { name: string } }).academies?.name ?? '연결된 학원'} ·{' '}
          {student.grade}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-white border">
          <p className="text-xs text-slate-500 mb-1">오늘 수업</p>
          <p className="font-semibold">{todayLog ? todayLog.unit || '기록 있음' : '오늘 기록 없음'}</p>
          {todayLog && (
            <p className="text-xs text-slate-400 mt-1">
              {ATTENDANCE_LABELS[todayLog.attendance_status]}
            </p>
          )}
        </div>
        <div className="rounded-2xl p-5 bg-white border">
          <p className="text-xs text-slate-500 mb-1">오늘 과제</p>
          <p className="font-semibold">
            {todayLog ? HOMEWORK_LABELS[todayLog.homework_status] : '-'}
          </p>
        </div>
        <div className="rounded-2xl p-5 bg-white border">
          <p className="text-xs text-slate-500 mb-1">최근 점수</p>
          <p className="font-semibold">{latestScore?.test_score ?? '-'}점</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-blue-50 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-900 mb-2">최근 피드백</h3>
        <p className="text-sm text-blue-800 leading-relaxed">{feedback}</p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border">
        <h3 className="text-sm font-bold px-5 py-3 border-b">최근 수업</h3>
        {logsLoading ? (
          <PageLoader />
        ) : logs.length === 0 ? (
          <EmptyState title="기록 없음" />
        ) : (
          <ul className="divide-y text-sm">
            {logs.map((l: LessonLog) => (
              <li key={l.id} className="px-5 py-3 flex justify-between">
                <span>
                  {l.lesson_date} · {l.unit}
                </span>
                <span className="text-slate-500">
                  {HOMEWORK_LABELS[l.homework_status]}
                  {l.test_score != null ? ` · ${l.test_score}점` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
