'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { consultationCardPath } from '@/lib/documentRoutes';
import { SavedDocumentList } from '@/components/documents/SavedDocumentList';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationCards } from '@/hooks/useConsultationCards';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useAuth } from '@/context/AuthContext';
import { fetchAiGenerate } from '@/lib/ai/client';
import { calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { StaffPageIntro } from '@/components/ui/StaffPageIntro';
import { STAFF_PAGES } from '@/lib/staffPages';
import type { ConsultationStatus } from '@/types/database';
import { AiSourceBadge } from '@/components/ai/AiSourceBadge';

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
  const router = useRouter();
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
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'rules' | null>(null);
  const [aiFallbackReason, setAiFallbackReason] = useState<string | null>(null);
  const [aiBackend, setAiBackend] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  const [savedFilter, setSavedFilter] = useState<'all' | ConsultationStatus>('all');

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { cards, loading: cardsLoading, saveCard } = useConsultationCards(
    studentId || undefined
  );
  const { addFollowup } = useConsultationFollowups(studentId);

  useEffect(() => {
    const q =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('student')
        : null;
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId]);

  const student = students.find((s) => s.id === studentId);

  const resetCard = () => {
    setHasGenerated(false);
    setLearningSummary('');
    setEvidenceSummary('');
    setConsultationPoints([]);
    setParentMessage('');
    setAiSource(null);
    setAiFallbackReason(null);
    setAiBackend(null);
  };

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

    const base = {
      logs: periodLogs,
      student: { name: student.name, grade: student.grade },
      periodStart,
      periodEnd,
      academyName: academy?.name ?? '학원',
    };

    setGenerating(true);
    setAiSource(null);
    setAiFallbackReason(null);
    setAiBackend(null);
    try {
      const [learn, evidence, points, message] = await Promise.all([
        fetchAiGenerate({ task: 'learningSummary', ...base }),
        fetchAiGenerate({ task: 'evidenceSummary', ...base }),
        fetchAiGenerate({ task: 'consultationPoints', ...base }),
        fetchAiGenerate({ task: 'parentMessage', ...base }),
      ]);

      if (learn.ok && learn.text) setLearningSummary(learn.text);
      if (evidence.ok && evidence.text) setEvidenceSummary(evidence.text);
      if (points.ok) {
        setConsultationPoints(
          points.points?.length ? points.points : points.text ? [points.text] : []
        );
      }
      if (message.ok && message.text) setParentMessage(message.text);

      setHasGenerated(true);

      const sources = [learn.source, evidence.source, points.source, message.source];
      const allGemini = sources.every((s) => s === 'gemini');
      setAiSource(allGemini ? 'gemini' : 'rules');
      setAiBackend(learn.backend ?? evidence.backend ?? null);
      setAiFallbackReason(
        learn.fallbackReason ??
          evidence.fallbackReason ??
          points.fallbackReason ??
          message.fallbackReason ??
          (allGemini ? null : '일부 항목이 규칙 기반으로 생성되었습니다.')
      );
    } finally {
      setGenerating(false);
    }
  };

  const scoreChart =
    hasGenerated && student
      ? calculateScoreTrend(
          logs.filter(
            (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
          )
        ).points.map((p) => ({ date: p.date, score: p.score }))
      : [];

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
    if (!studentId || !hasGenerated) return;
    setSaving(true);
    const { error, cardId } = await saveCard({
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
    if (error) {
      setToast(error);
      setTimeout(() => setToast(''), 2500);
      return;
    }
    setToast('저장됐습니다. 상담 후 카드 상세에서 「상담 완료 처리」를 눌러 주세요.');
    setTimeout(() => setToast(''), 4000);
    if (cardId) router.push(consultationCardPath(cardId));
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
        title={STAFF_PAGES['consultation-cards'].title}
        description={STAFF_PAGES['consultation-cards'].description}
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
      <StaffPageIntro pageKey="consultation-cards" />

      <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">학생</label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                resetCard();
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
                  resetCard();
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
                  resetCard();
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
            {generating ? '만드는 중…' : '상담 카드 만들기'}
          </button>
        </div>
        {!hasGenerated && !generating && (
          <p className="mt-4 text-xs text-slate-400">
            학생과 기간을 선택한 뒤 「상담 카드 만들기」를 눌러 주세요.
          </p>
        )}
      </div>

      {!student ? (
        <EmptyState title="학생을 선택해 주세요" />
      ) : !hasGenerated && !generating ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
          <p className="text-slate-400 text-sm">아직 상담 카드가 없습니다</p>
          <p className="text-slate-300 text-xs mt-2">
            위에서 「상담 카드 만들기」를 누르면 초안이 생성됩니다
          </p>
        </div>
      ) : generating ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <p className="text-slate-500 text-sm">상담 카드를 작성하고 있습니다…</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 min-w-0 max-w-full">
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2 justify-end bg-slate-50/50">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-white cursor-pointer"
            >
              {copied ? '복사됨' : '전체 복사'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>

          <div className="p-6 sm:p-8 text-white" style={{ background: 'linear-gradient(135deg, #312e81, #1e1b4b)' }}>
            <h2 className="text-xl font-bold">{student.name} 학생 상담 카드</h2>
            <p className="text-sm text-indigo-200/90 mt-1">
              {periodStart} ~ {periodEnd}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-7">
            {scoreChart.length > 0 && (
              <div className="w-full min-w-0 h-[150px]">
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={scoreChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">학습 요약</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {learningSummary}
              </p>
            </section>
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">근거 데이터</h3>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                {evidenceSummary}
              </pre>
            </section>
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">상담 포인트</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
                {consultationPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">학부모 메시지 초안</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {parentMessage}
              </p>
            </section>
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h3 className="text-sm font-bold text-indigo-950 mb-1">
                다음 상담 전 확인할 내용
              </h3>
              <p className="text-xs text-indigo-700/80 mb-2">
                저장 시 학생 상세·수업 준비·타임라인에 연결됩니다. 한 줄에 하나씩 입력하세요.
              </p>
              <textarea
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                placeholder={'함수 단원 다시 확인\n숙제 루틴 체크\n계산 실수 재확인'}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-indigo-100 text-sm"
              />
            </section>
          </div>
        </div>
      )}

      {(() => {
        const pendingN = cards.filter((c) => (c.consultation_status ?? 'pending') === 'pending').length;
        const filtered =
          savedFilter === 'all'
            ? cards
            : cards.filter((c) => (c.consultation_status ?? 'pending') === savedFilter);
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                저장 {cards.length}건
                {pendingN > 0 && (
                  <span className="text-amber-700 font-medium"> · 상담 대기 {pendingN}건</span>
                )}
              </span>
              <div className="flex gap-1 ml-auto">
                {(
                  [
                    ['all', '전체'],
                    ['pending', '대기'],
                    ['completed', '완료'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSavedFilter(key)}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                      savedFilter === key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <SavedDocumentList
              title="저장된 상담 카드"
              loading={cardsLoading}
              emptyMessage={
                savedFilter === 'all' ? undefined : '해당 상태의 카드가 없습니다.'
              }
              items={filtered.slice(0, 12).map((c) => ({
                id: c.id,
                href: consultationCardPath(c.id),
                primary: `${(c.students as { name?: string })?.name ?? '학생'} · ${c.period_start} ~ ${c.period_end}`,
                secondary: `저장 ${c.created_at.slice(0, 10)}`,
                consultationStatus: c.consultation_status ?? 'pending',
              }))}
            />
          </div>
        );
      })()}
    </div>
  );
}
