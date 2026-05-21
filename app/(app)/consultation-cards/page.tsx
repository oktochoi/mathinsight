'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationCards } from '@/hooks/useConsultationCards';
import { useAuth } from '@/context/AuthContext';
import {
  generateLearningSummary,
  generateEvidenceSummary,
  generateConsultationPoints,
  generateParentMessage,
} from '@/lib/reportGenerator';
import { calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function ConsultationCardPage() {
  const { academy } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const period = useMemo(defaultPeriod, []);
  const [studentId, setStudentId] = useState('');
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const [learningSummary, setLearningSummary] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [consultationPoints, setConsultationPoints] = useState<string[]>([]);
  const [parentMessage, setParentMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { cards, loading: cardsLoading, saveCard } = useConsultationCards();

  useEffect(() => {
    const q =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('student')
        : null;
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId]);

  const student = students.find((s) => s.id === studentId);
  const scoreChart = calculateScoreTrend(logs).points.map((p) => ({
    date: p.date,
    score: p.score,
  }));

  const handleGenerate = () => {
    if (!student) return;
    const periodLogs = logs.filter(
      (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
    );
    setLearningSummary(generateLearningSummary(periodLogs, student.name));
    setEvidenceSummary(generateEvidenceSummary(periodLogs));
    setConsultationPoints(generateConsultationPoints(periodLogs));
    setParentMessage(
      generateParentMessage(periodLogs, student.name, academy?.name ?? '학원')
    );
  };

  useEffect(() => {
    if (studentId && logs.length >= 0 && !logsLoading) handleGenerate();
  }, [studentId, periodStart, periodEnd, logs.length, logsLoading]);

  const fullText = [
    learningSummary,
    '',
    '[근거]',
    evidenceSummary,
    '',
    '[상담 포인트]',
    ...consultationPoints.map((p) => `· ${p}`),
    '',
    '[학부모 메시지]',
    parentMessage,
  ].join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async () => {
    if (!studentId) return;
    setSaving(true);
    const { error } = await saveCard({
      student_id: studentId,
      generated_by: null,
      period_start: periodStart,
      period_end: periodEnd,
      learning_summary: learningSummary,
      evidence_summary: evidenceSummary,
      consultation_points: consultationPoints,
      parent_message: parentMessage,
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

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation Card</h1>
          <p className="text-sm text-slate-500">기록 기반 상담 카드 (rule-based)</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleCopy} className="px-4 py-2 rounded-xl border text-sm cursor-pointer">
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !learningSummary}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50 cursor-pointer"
          >
            {saving ? '저장 중...' : 'DB 저장'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white border border-slate-200 flex flex-wrap gap-4">
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm min-w-[160px]"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" />
        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" />
        <button type="button" onClick={handleGenerate} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm cursor-pointer">
          다시 생성
        </button>
      </div>

      {!student ? (
        <EmptyState title="학생을 선택하세요" />
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #0f2040, #0c1829)' }}>
            <h2 className="text-xl font-bold">{student.name} 학생 상담 카드</h2>
            <p className="text-sm text-slate-400 mt-1">
              {periodStart} ~ {periodEnd}
            </p>
          </div>
          <div className="p-8 space-y-6">
            {scoreChart.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={scoreChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <section>
              <h3 className="text-sm font-bold mb-2">학습 요약</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{learningSummary || '기록이 없습니다.'}</p>
            </section>
            <section>
              <h3 className="text-sm font-bold mb-2">근거 데이터</h3>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{evidenceSummary}</pre>
            </section>
            <section>
              <h3 className="text-sm font-bold mb-2">상담 포인트</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {consultationPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-sm font-bold mb-2">학부모 메시지 초안</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{parentMessage}</p>
            </section>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5 bg-white border border-slate-200">
        <h3 className="text-sm font-bold mb-3">저장된 상담 카드</h3>
        {cardsLoading ? (
          <PageLoader />
        ) : cards.length === 0 ? (
          <EmptyState title="저장된 카드 없음" />
        ) : (
          <ul className="space-y-2 text-sm">
            {cards.slice(0, 10).map((c) => (
              <li key={c.id} className="border-b border-slate-50 pb-2">
                {(c.students as { name?: string })?.name} · {c.period_start} ~ {c.period_end} ·{' '}
                {c.created_at.slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
