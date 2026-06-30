'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { consultationCardPath } from '@/lib/documentRoutes';
import { SavedDocumentList } from '@/components/documents/SavedDocumentList';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationCards } from '@/hooks/useConsultationCards';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  pointsToStrings,
  useConsultationCardAi,
} from '@/hooks/useConsultationCardAi';
import { fetchAiGenerate } from '@/lib/ai/client';
import { calculateScoreTrend } from '@/lib/analytics';
import { PageLoader, EmptyState } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { AiRulesFallbackBanner } from '@/components/ui/AiRulesFallbackBanner';
import { STAFF_PAGES } from '@/lib/staffPages';
import { supabase } from '@/lib/supabase';
import type { CounselingSession } from '@/types/database';

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
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { academy } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const period = useMemo(defaultPeriod, []);
  const [studentId, setStudentId] = useState('');
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const { aiState, dispatch } = useConsultationCardAi();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { message: toast, show: showToast } = useToast(3500);
  const [linkedSession, setLinkedSession] = useState<CounselingSession | null>(null);

  const {
    learningSummary,
    evidenceSummary,
    consultationPoints,
    parentMessage,
    hasGenerated,
    source: aiSource,
    fallbackReason: aiFallbackReason,
  } = aiState;

  const { logs, loading: logsLoading } = useLessonLogs({
    studentId: studentId || undefined,
    fromDate: periodStart,
    toDate: periodEnd,
  });
  const { cards, loading: cardsLoading, saveCard } = useConsultationCards(studentId || undefined);
  const { followups, updateStatus } = useConsultationFollowups(studentId || undefined);

  useEffect(() => {
    const q = searchParams.get('student');
    if (q) setStudentId(q);
    else if (students[0] && !studentId) setStudentId(students[0].id);
  }, [students, studentId, searchParams]);

  useEffect(() => {
    if (!sessionId) {
      setLinkedSession(null);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('counseling_sessions')
        .select('*, students(id, name, grade)')
        .eq('id', sessionId)
        .maybeSingle();
      if (!data) return;
      const session = data as CounselingSession;
      setLinkedSession(session);
      setStudentId(session.student_id);
      dispatch({
        type: 'PATCH_FROM_SESSION',
        learningSummary: session.summary?.trim() || undefined,
        parentMessage: session.parent_message_draft?.trim() || undefined,
        evidenceSummary:
          session.transcript?.trim() && !session.summary?.trim()
            ? session.transcript
            : undefined,
      });
    })();
  }, [sessionId, dispatch]);

  const student = students.find((s) => s.id === studentId);
  const scoreTrend = useMemo(() => calculateScoreTrend(logs), [logs]);
  const scoreChart = scoreTrend.points.map((p) => ({ label: p.date, score: p.score }));

  const handleGenerate = async () => {
    if (!student) return;
    const periodLogs = logs.filter(
      (l) => l.lesson_date >= periodStart && l.lesson_date <= periodEnd
    );
    if (periodLogs.length === 0) {
      showToast('해당 기간에 수업 기록이 없습니다. 「오늘 수업」에서 먼저 입력해 주세요.');
      return;
    }

    setGenerating(true);

    const base = {
      logs: periodLogs,
      student: { name: student.name, grade: student.grade },
      periodStart,
      periodEnd,
      academyName: academy?.name ?? '학원',
    };

    try {
      const [ls, ev, cp, pm] = await Promise.all([
        fetchAiGenerate({ ...base, task: 'learningSummary' }),
        fetchAiGenerate({ ...base, task: 'evidenceSummary' }),
        fetchAiGenerate({ ...base, task: 'consultationPoints' }),
        fetchAiGenerate({ ...base, task: 'parentMessage' }),
      ]);

      if (!ls.ok && !ev.ok) {
        showToast(ls.error ?? ev.error ?? '생성 실패');
        return;
      }

      dispatch({
        type: 'SET_GENERATED',
        learningSummary: ls.text ?? '',
        evidenceSummary: ev.text ?? '',
        consultationPoints: cp.points ?? (cp.text ? cp.text.split('\n').filter(Boolean) : []),
        parentMessage: pm.text ?? '',
        source: ls.source ?? ev.source ?? null,
        fallbackReason: ls.fallbackReason ?? ev.fallbackReason ?? null,
        backend: ls.backend ?? ev.backend ?? null,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!studentId || !learningSummary.trim()) return;
    setSaving(true);
    const { error, cardId } = await saveCard({
      student_id: studentId,
      generated_by: null,
      period_start: periodStart,
      period_end: periodEnd,
      learning_summary: learningSummary,
      evidence_summary: evidenceSummary,
      consultation_points: pointsToStrings(consultationPoints),
      parent_message: parentMessage,
    });
    setSaving(false);
    if (error) {
      showToast(error);
      return;
    }
    showToast('상담 카드가 저장되었습니다. 상담 후 완료 처리해 주세요.');
    if (cardId) router.push(consultationCardPath(cardId));
  };

  if (studentsLoading) return <PageLoader />;

  if (students.length === 0) {
    return (
      <EmptyState
        title="학생이 없습니다"
        description="학생을 등록한 뒤 상담 준비를 시작하세요."
      />
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <Toast message={toast} />

      <PageHeader
        title={STAFF_PAGES['consultation-cards'].title}
        description={STAFF_PAGES['consultation-cards'].description}
      >
        <Link
          href="/counseling?step=session"
          className="text-xs text-violet-600 hover:underline font-medium"
        >
          ← 상담센터
        </Link>
        {generating && (
          <span className="inline-flex items-center gap-1.5 text-xs text-violet-600 font-medium animate-pulse">
            <i className="ri-sparkling-line" />분석 중…
          </span>
        )}
      </PageHeader>

      {linkedSession && (
        <div className="rounded-2xl p-4 space-y-3 app-card-violet-inline">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold app-text-violet">연결된 상담 기록</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--app-ink)' }}>{linkedSession.title}</p>
              <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                {(linkedSession.students as { name?: string })?.name ?? '학생'} ·{' '}
                {linkedSession.completed_at?.slice(0, 10) ?? '진행 중'}
              </p>
            </div>
            <Link
              href={`/counseling?step=${linkedSession.status === 'completed' || linkedSession.status === 'followup_needed' ? 'wrapup' : 'session'}`}
              className="text-xs font-medium hover:opacity-70 app-text-violet-accent"
            >
              상담 화면으로 →
            </Link>
          </div>
          {linkedSession.transcript?.trim() && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-2)' }}>상담 대화·전사</p>
              <p
                className="text-sm whitespace-pre-wrap rounded-lg p-3 max-h-40 overflow-y-auto"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-violet-border)', color: 'var(--app-ink-2)' }}
              >
                {linkedSession.transcript}
              </p>
            </div>
          )}
          {linkedSession.summary?.trim() && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-2)' }}>상담 요약</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--app-ink-2)' }}>{linkedSession.summary}</p>
            </div>
          )}
          {!linkedSession.transcript?.trim() && !linkedSession.summary?.trim() && (
            <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
              상담 진행 화면에서 전사·요약을 입력하면 여기에 표시됩니다.
            </p>
          )}
        </div>
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
                dispatch({ type: 'RESET' });
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
                  dispatch({ type: 'RESET' });
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
                  dispatch({ type: 'RESET' });
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
            {generating ? '준비 중…' : '상담 준비'}
          </button>
        </div>
        {followups.filter((f) => f.status === 'pending').length > 0 && (
          <div className="mt-3 rounded-xl px-3 py-2 space-y-2 app-banner-warning">
            <p className="text-xs font-semibold">
              후속 확인 대기 {followups.filter((f) => f.status === 'pending').length}건
            </p>
            <ul className="space-y-1.5">
              {followups.filter((f) => f.status === 'pending').slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--app-ink-2)' }}>
                  <input type="checkbox" onChange={() => void updateStatus(f.id, 'done')} />
                  <span>{f.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {scoreChart.length > 1 && (
        <div className="app-card p-4 min-w-0">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>최근 성적</p>
          <div className="w-full min-w-0" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height={160} minWidth={0}>
            <AreaChart data={scoreChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="var(--chart-violet)" fill="var(--chart-violet)" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasGenerated && !generating && (
        <AiRulesFallbackBanner source={aiSource} fallbackReason={aiFallbackReason} />
      )}

      <div
        className="rounded-2xl overflow-hidden min-h-[320px]"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
      >
        {!hasGenerated && !generating ? (
          <div className="flex items-center justify-center p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
              학생·기간 선택 후 「상담 준비」를 누르면 상담 요약이 생성됩니다.
            </p>
          </div>
        ) : generating ? (
          <div className="flex items-center justify-center p-12">
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>수업 기록을 분석하고 있습니다…</p>
          </div>
        ) : (
          <div>
            {[
              {
                label: '학습 요약',
                value: learningSummary,
                onChange: (v: string) => dispatch({ type: 'SET_LEARNING_SUMMARY', value: v }),
                minH: 'min-h-[80px]',
              },
              {
                label: '근거 데이터',
                value: evidenceSummary,
                onChange: (v: string) => dispatch({ type: 'SET_EVIDENCE_SUMMARY', value: v }),
                minH: 'min-h-[80px]',
              },
            ].map(({ label, value, onChange, minH }) => (
              <section key={label} className="p-5" style={{ borderBottom: '1px solid var(--app-border)' }}>
                <h3 className="text-xs font-bold mb-2 app-text-violet-accent">{label}</h3>
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={`w-full text-sm leading-relaxed rounded-xl p-3 resize-none ${minH}`}
                  style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink-2)', outline: 'none' }}
                />
              </section>
            ))}
            <section className="p-5" style={{ borderBottom: '1px solid var(--app-border)' }}>
              <h3 className="text-xs font-bold mb-2 app-text-violet-accent">상담 준비 메모</h3>
              <ul className="space-y-1.5 mb-2">
                {consultationPoints.map((p) => (
                  <li key={p.id} className="flex gap-2 text-sm">
                    <span className="app-text-violet-muted">·</span>
                    <input
                      value={p.text}
                      onChange={(e) =>
                        dispatch({ type: 'SET_POINT', id: p.id, text: e.target.value })
                      }
                      className="flex-1 py-0.5 bg-transparent"
                      style={{ borderBottom: '1px solid var(--app-border)', color: 'var(--app-ink-2)', outline: 'none' }}
                    />
                  </li>
                ))}
              </ul>
            </section>
            <section className="p-5" style={{ borderBottom: '1px solid var(--app-border)' }}>
              <h3 className="text-xs font-bold mb-2 app-text-violet-accent">학부모에게 전달할 내용</h3>
              <textarea
                value={parentMessage}
                onChange={(e) => dispatch({ type: 'SET_PARENT_MESSAGE', value: e.target.value })}
                className="w-full text-sm leading-relaxed rounded-xl p-3 min-h-[100px] resize-none"
                style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink-2)', outline: 'none' }}
              />
            </section>
            <div
              className="px-5 py-4 flex flex-wrap gap-2 justify-between items-center"
              style={{ background: 'var(--app-surface-2)' }}
            >
              <Link
                href={`/counseling?step=session&student=${studentId}`}
                className="text-sm font-medium hover:opacity-70 app-text-violet-accent"
              >
                상담 진행으로 →
              </Link>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !learningSummary.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                {saving ? '저장 중…' : '저장 (상담 대기)'}
              </button>
            </div>
          </div>
        )}
      </div>

      <SavedDocumentList
        title="저장된 상담 요약"
        loading={cardsLoading}
        items={cards.slice(0, 12).map((c) => ({
          id: c.id,
          href: consultationCardPath(c.id),
          primary: `${(c.students as { name?: string })?.name ?? '학생'} · ${c.period_start} ~ ${c.period_end}`,
          secondary: `저장 ${c.created_at.slice(0, 10)}`,
          consultationStatus: c.consultation_status,
        }))}
      />
    </div>
  );
}
