'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/useStudents';
import { useCounselingSessions } from '@/hooks/useCounselingSessions';
import { useCounselingTargets } from '@/hooks/useCounselingTargets';
import { useConsultationCards } from '@/hooks/useConsultationCards';
import { PageHeader } from '@/components/ui/PageHeader';
import { STAFF_PAGES } from '@/lib/staffPages';
import { PageLoader, ErrorBanner, EmptyState } from '@/components/ui/DataStates';
import {
  COUNSELING_STATUS_LABELS,
  COUNSELING_STATUS_STYLES,
  COUNSELING_TYPE_LABELS,
} from '@/lib/counselingLabels';
import { FollowupPanel } from '@/components/counseling/FollowupPanel';
import { IntakeConsultationPanel } from '@/components/counseling/IntakeConsultationPanel';
import {
  filterActionablePendingCards,
  filterPrepTargets,
  sessionListFilterForStep,
} from '@/lib/counselingFlow';
import { cn } from '@/lib/cn';
import type { CounselingSession, CounselingSessionStatus, CounselingSessionType } from '@/types/database';

const typeOptions: { value: CounselingSessionType; label: string }[] = [
  { value: 'learning', label: '학습 상담' },
  { value: 'parent', label: '학부모 상담' },
  { value: 'student', label: '학생 상담' },
  { value: 'reregistration', label: '재등록 상담' },
];

function formatScheduled(iso: string | null) {
  if (!iso) return '일정 미정';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SessionDetailPanel({
  session,
  onStart,
  onComplete,
  onFollowup,
  onClose,
  onUpdateTranscript,
}: {
  session: CounselingSession;
  onStart: () => void;
  onComplete: (summary: string, parentMsg: string, checklist: CounselingSession['followup_checklist']) => void;
  onFollowup: (checklist: CounselingSession['followup_checklist']) => void;
  onClose: () => void;
  onUpdateTranscript: (patch: {
    recording_url?: string;
    transcript?: string;
    summary?: string;
  }) => Promise<void>;
}) {
  const [summary, setSummary] = useState(session.summary ?? '');
  const [parentMsg, setParentMsg] = useState(session.parent_message_draft ?? '');
  const [checklist, setChecklist] = useState(session.followup_checklist ?? []);
  const [newItem, setNewItem] = useState('');
  const [recordingUrl, setRecordingUrl] = useState(session.recording_url ?? '');
  const [transcript, setTranscript] = useState(session.transcript ?? '');
  const [sttBusy, setSttBusy] = useState(false);
  const [sttToast, setSttToast] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const st = session.students;

  const checkMicPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicDenied(true);
      setSttToast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicDenied(false);
      setSttToast('마이크 권한이 허용되었습니다. (STT 연동 전까지는 전사를 직접 입력해 주세요.)');
      setTimeout(() => setSttToast(''), 4000);
    } catch {
      setMicDenied(true);
      setSttToast('마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
    }
  };

  const saveTranscriptManual = async () => {
    setSttBusy(true);
    const res = await fetch('/api/counseling/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        transcript,
        mode: 'save_manual',
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    setSttBusy(false);
    if (!json.ok) {
      setSttToast(json.error ?? '저장 실패');
      return;
    }
    await onUpdateTranscript({ recording_url: recordingUrl || undefined, transcript });
    setSttToast('전사가 저장되었습니다.');
    setTimeout(() => setSttToast(''), 2500);
  };

  const aiSummarize = async () => {
    setSttBusy(true);
    const res = await fetch('/api/counseling/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        transcript,
        mode: 'summarize',
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string; summary?: string };
    setSttBusy(false);
    if (!json.ok) {
      setSttToast(json.error ?? '요약 실패');
      return;
    }
    if (json.summary) setSummary(json.summary);
    await onUpdateTranscript({
      recording_url: recordingUrl || undefined,
      transcript,
      summary: json.summary,
    });
    setSttToast('AI 요약이 상담 요약에 반영되었습니다.');
    setTimeout(() => setSttToast(''), 3000);
  };

  return (
    <div
      className="rounded-2xl border-2 border-violet-200 overflow-hidden shadow-lg"
      style={{ background: 'var(--app-surface)' }}
    >
      <div className="px-5 py-4 border-b border-violet-100 bg-violet-50/60 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-violet-700">상담 상세</p>
          <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>
            {session.title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
            {st?.name ?? '학생'} · {COUNSELING_TYPE_LABELS[session.session_type]} ·{' '}
            {formatScheduled(session.scheduled_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--app-ink-4)] hover:text-[var(--app-ink-3)] text-xl"
        >
          ×
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {session.status === 'scheduled' && (
            <button type="button" onClick={onStart} className="app-btn app-btn-primary">
              상담 시작
            </button>
          )}
          {session.status === 'in_progress' && (
            <button
              type="button"
              onClick={() => onComplete(summary, parentMsg, checklist)}
              className="app-btn app-btn-primary"
            >
              상담 완료
            </button>
          )}
          {session.status === 'completed' && (
            <button
              type="button"
              onClick={() => onFollowup(checklist)}
              className="px-4 py-2 rounded-xl border border-violet-200 text-violet-800 text-sm font-semibold"
            >
              후속조치 필요로 표시
            </button>
          )}
          <Link href={`/students/${session.student_id}`} className="app-btn app-btn-ghost">
            학생 상세
          </Link>
          <Link
            href={`/consultation-cards?student=${session.student_id}&session=${session.id}`}
            className="app-btn app-btn-ghost"
          >
            학부모 전달 문구
          </Link>
        </div>

        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: 'var(--app-surface-2)', borderColor: 'var(--app-border)' }}
        >
          <p className="text-xs font-bold" style={{ color: 'var(--app-ink-3)' }}>
            녹음 · STT · AI 요약
          </p>
          {micDenied ? (
            <p className="text-xs rounded-lg px-3 py-2 app-inline-danger">
              마이크 권한이 필요합니다. 브라우저 주소창 옆 자물쇠에서 마이크를 허용한 뒤 다시 시도해 주세요.
            </p>
          ) : (
            <p className="text-xs rounded-lg px-3 py-2 app-banner-warning">
              STT 자동 전사 연동 전입니다. 아래에서 전사 텍스트를 직접 입력하거나, 마이크 권한을 먼저 확인해 주세요.
            </p>
          )}
          <button
            type="button"
            onClick={() => void checkMicPermission()}
            className="app-btn app-btn-ghost text-xs"
          >
            마이크 권한 확인
          </button>
          {sttToast && (
            <p className={cn('text-xs rounded-lg px-3 py-2', micDenied ? 'app-inline-danger' : 'app-inline-success')}>
              {sttToast}
            </p>
          )}
          <input
            value={recordingUrl}
            onChange={(e) => setRecordingUrl(e.target.value)}
            placeholder="녹음 파일 URL (선택)"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
          />
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            placeholder="녹취 전사·메모를 붙여넣으세요 (STT 연동 전 수동 입력)"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sttBusy || !transcript.trim()}
              onClick={() => void saveTranscriptManual()}
              className="app-btn app-btn-ghost text-xs disabled:opacity-50"
            >
              전사 저장
            </button>
            <button
              type="button"
              disabled={sttBusy || !transcript.trim()}
              onClick={() => void aiSummarize()}
              className="app-btn app-btn-primary text-xs disabled:opacity-50"
            >
              {sttBusy ? '처리 중…' : 'AI 요약 → 상담 요약'}
            </button>
          </div>
          {session.transcript_source && (
            <p className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>
              출처:{' '}
              {session.transcript_source === 'ai_summary'
                ? 'AI 요약'
                : session.transcript_source === 'stt'
                  ? 'STT'
                  : '수동'}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold" style={{ color: 'var(--app-ink-3)' }}>
            상담 후 요약
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="상담 내용·합의 사항을 기록하세요"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--app-border)' }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: 'var(--app-ink-3)' }}>
            학부모 전달 메시지 초안
          </label>
          <textarea
            value={parentMsg}
            onChange={(e) => setParentMsg(e.target.value)}
            rows={3}
            placeholder="학부모에게 보낼 문자·카톡 초안"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--app-border)' }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: 'var(--app-ink-3)' }}>
            후속조치 체크리스트
          </label>
          <ul className="mt-2 space-y-2">
            {checklist.map((item, i) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => {
                    const next = [...checklist];
                    next[i] = { ...item, done: !item.done };
                    setChecklist(next);
                  }}
                />
                <span className={cn('text-sm', item.done && 'line-through text-[var(--app-ink-4)]')}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="확인 항목 추가"
              className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
              style={{ borderColor: 'var(--app-border)' }}
            />
            <button
              type="button"
              onClick={() => {
                if (!newItem.trim()) return;
                setChecklist([
                  ...checklist,
                  { id: crypto.randomUUID(), label: newItem.trim(), done: false },
                ]);
                setNewItem('');
              }}
              className="app-btn app-btn-ghost"
            >
              추가
            </button>
          </div>
        </div>

        {/* 상담 완료 후 다음 단계 — 학부모 전달 */}
        {(session.status === 'completed' || session.parent_message_draft) && (
          <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 app-banner-success">
            <div>
              <p className="text-sm font-semibold">다음 단계: 학부모에게 전달</p>
              <p className="text-xs mt-0.5 opacity-90">
                {session.parent_message_draft
                  ? '학부모 전달 초안이 준비되어 있습니다.'
                  : '상담 카드에서 학부모 전달 문구를 작성하세요.'}
              </p>
            </div>
            <Link
              href={`/consultation-cards?student=${session.student_id}&session=${session.id}`}
              className="app-btn app-btn-primary shrink-0"
            >
              <i className="ri-file-list-3-line" />
              학부모 전달 문구 편집
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CounselingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CounselingPageContent />
    </Suspense>
  );
}

const STEP_META: Record<
  string,
  { title: string; desc: string; action: string; filter: 'all' | CounselingSessionStatus | 'step' }
> = {
  prep: {
    title: '상담 준비',
    desc: '상담 전 수업 기록 요약을 만듭니다. 상담이 끝난 학생은 여기서 빠집니다.',
    action: '상담 준비',
    filter: 'step',
  },
  session: {
    title: '상담 진행',
    desc: '예약 → 시작 → 기록 → 완료. 대화 내용은 이 화면에 남깁니다.',
    action: '상담 예약',
    filter: 'step',
  },
  wrapup: {
    title: '마무리·후속',
    desc: '학부모 전달 문구 확인과 후속 조치를 처리합니다.',
    action: '기록 확인',
    filter: 'step',
  },
  intake: {
    title: '신입 원생 상담',
    desc: '문의·예약·상담 기록·등록 전환을 관리합니다.',
    action: '신입 상담 등록',
    filter: 'step',
  },
};

const LEGACY_STEP: Record<string, string> = {
  done: 'wrapup',
  followup: 'wrapup',
};

const VIEW_TO_STEP: Record<string, string> = {
  center: 'session',
  book: 'session',
  history: 'wrapup',
};

function CounselingPageContent() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const viewParam = searchParams.get('view');
  const stepRaw = stepParam ?? (viewParam ? VIEW_TO_STEP[viewParam] : null) ?? 'session';
  const step = LEGACY_STEP[stepRaw] ?? stepRaw;
  const presetStudent = searchParams.get('student') ?? '';
  const presetType = searchParams.get('type') as CounselingSessionType | null;
  const meta = STEP_META[step] ?? STEP_META.session;

  const { students, loading: studentsLoading } = useStudents();
  const {
    sessions,
    loading,
    error,
    createSession,
    startSession,
    completeSession,
    markFollowupNeeded,
    updateSession,
  } = useCounselingSessions();
  const { cards } = useConsultationCards();
  const { targets: counselingTargets } = useCounselingTargets();

  const [newStudentId, setNewStudentId] = useState('');
  const [newType, setNewType] = useState<CounselingSessionType>('learning');
  const [newTitle, setNewTitle] = useState('');
  const [newScheduled, setNewScheduled] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (presetStudent) setNewStudentId(presetStudent);
  }, [presetStudent]);

  useEffect(() => {
    if (presetType && typeOptions.some((o) => o.value === presetType)) {
      setNewType(presetType);
    }
  }, [presetType]);

  const [filter, setFilter] = useState<'all' | CounselingSessionStatus>('all');

  useEffect(() => {
    setFilter('all');
  }, [step]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stepSessions = useMemo(
    () => sessionListFilterForStep(step, sessions).filter((s) => s.session_type !== 'intake'),
    [step, sessions]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return stepSessions;
    return stepSessions.filter((s) => s.status === filter);
  }, [stepSessions, filter]);

  const prepTargets = useMemo(
    () => filterPrepTargets(counselingTargets, sessions),
    [counselingTargets, sessions]
  );

  const pendingCards = useMemo(
    () => cards.filter((c) => (c.consultation_status ?? 'pending') === 'pending'),
    [cards]
  );

  const actionablePendingCards = useMemo(
    () => filterActionablePendingCards(pendingCards, sessions),
    [pendingCards, sessions]
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return sessions.filter(
      (s) =>
        (s.status === 'scheduled' || s.status === 'in_progress') &&
        s.scheduled_at &&
        new Date(s.scheduled_at).getTime() >= now - 86400000
    );
  }, [sessions]);

  const selected = sessions.find((s) => s.id === selectedId);

  const handleCreate = async () => {
    if (!newStudentId) return;
    const result = await createSession({
      student_id: newStudentId,
      session_type: newType,
      title: newTitle.trim() || COUNSELING_TYPE_LABELS[newType],
      scheduled_at: newScheduled ? new Date(newScheduled).toISOString() : undefined,
    });
    if (result.error) {
      setToast(result.error);
      return;
    }
    setNewTitle('');
    setNewScheduled('');
    setToast('상담이 예약되었습니다.');
    setTimeout(() => setToast(''), 2500);
    if (result.id) setSelectedId(result.id);
  };

  if (step !== 'intake' && (studentsLoading || loading)) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title={meta.title}
        description={step === 'session' ? STAFF_PAGES.counseling.description : meta.desc}
      />

      <nav className="flex flex-wrap gap-1 border-b pb-px border-[var(--app-border)]">
        {(
          [
            ['prep', '① 준비'],
            ['session', '② 진행'],
            ['wrapup', '③ 마무리'],
            ['intake', '신입 상담'],
          ] as const
        ).map(([v, label]) => (
          <Link
            key={v}
            href={`/counseling?step=${v}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              step === v
                ? 'border-[var(--app-accent)] text-[var(--app-accent-text)]'
                : 'border-transparent text-[var(--app-ink-3)] hover:text-[var(--app-ink)]'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {step === 'prep' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-amber-900">상담 전 준비</h2>
            <p className="text-sm text-amber-800/90 mt-1">
              상담 <strong>전에</strong> 수업 기록 요약을 만듭니다. 이미 상담을 마친 학생은 목록에서
              빠집니다.
            </p>
          </div>

          {actionablePendingCards.length === 0 && prepTargets.length === 0 ? (
            <p className="text-sm rounded-xl px-4 py-3 app-banner-warning">
              지금 준비할 상담이 없습니다. 필요할 때 학생을 선택해 요약을 만들거나, ② 진행에서 바로
              상담을 예약하세요.
            </p>
          ) : (
            <>
              {actionablePendingCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    요약 작성됨 · 상담 대기 ({actionablePendingCards.length})
                  </p>
                  <ul className="space-y-2">
                    {actionablePendingCards.slice(0, 8).map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/consultation-cards/${c.id}`}
                          className="flex items-center justify-between text-sm rounded-lg border border-amber-100 px-3 py-2 hover:border-amber-300"
                          style={{ background: 'var(--app-surface)' }}
                        >
                          <span className="font-medium" style={{ color: 'var(--app-ink)' }}>
                            {(c.students as { name?: string })?.name ?? '학생'}
                          </span>
                          <span className="text-xs text-amber-700">요약 보기 →</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prepTargets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    아직 요약 없음 · 상담 검토 권장 ({prepTargets.length})
                  </p>
                  <ul className="space-y-2">
                    {prepTargets.slice(0, 6).map((t) => (
                      <li key={`${t.studentId}-${t.snapshotType}`}>
                        <Link
                          href={`/consultation-cards?student=${t.studentId}`}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm rounded-lg border border-amber-100 px-3 py-2 hover:border-amber-300"
                          style={{ background: 'var(--app-surface)' }}
                        >
                          <span>
                            <span className="font-medium" style={{ color: 'var(--app-ink)' }}>
                              {t.name}
                            </span>
                            <span className="text-xs ml-2" style={{ color: 'var(--app-ink-3)' }}>
                              {t.grade}
                            </span>
                          </span>
                          <span className="text-xs text-rose-700">{t.reason}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={
                presetStudent || newStudentId
                  ? `/consultation-cards?student=${presetStudent || newStudentId}`
                  : '/consultation-cards'
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
            >
              <i className="ri-sparkling-2-line" />
              상담 요약 만들기
            </Link>
            <Link
              href="/counseling?step=session"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 text-amber-900 text-sm font-medium hover:bg-amber-100/50"
            >
              ② 상담 진행으로
            </Link>
          </div>
        </div>
      )}

      {step === 'intake' && <IntakeConsultationPanel />}

      {step === 'wrapup' && <FollowupPanel />}

      {step !== 'intake' && error && <ErrorBanner message={error} />}
      {step !== 'intake' && toast && (
        <p className="text-sm rounded-xl px-3 py-2 app-inline-success">
          {toast}
        </p>
      )}

      {step !== 'intake' && (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-xs text-indigo-700 font-medium">오늘·예정 상담</p>
              <p className="text-2xl font-bold text-indigo-900 tabular-nums mt-1">{upcoming.length}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs text-amber-800 font-medium">준비 대기</p>
              <p className="text-2xl font-bold text-amber-900 tabular-nums mt-1">
                {actionablePendingCards.length}
              </p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="text-xs text-violet-800 font-medium">후속·마무리</p>
              <p className="text-2xl font-bold text-violet-900 tabular-nums mt-1">
                {sessions.filter((s) => s.status === 'followup_needed').length}
              </p>
            </div>
          </div>

          <div className="app-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[var(--app-border)]">
              <h2 className="font-bold text-sm" style={{ color: 'var(--app-ink)' }}>
                상담 목록
              </h2>
              <div className="flex gap-1 ml-auto flex-wrap">
                {(
                  [
                    ['all', '전체'],
                    ['scheduled', '예정'],
                    ['in_progress', '진행'],
                    ['completed', '완료'],
                    ['followup_needed', '후속'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border',
                      filter === key
                        ? 'bg-[var(--app-accent)] text-white border-[var(--app-accent)]'
                        : 'bg-[var(--app-surface)] text-[var(--app-ink-3)] border-[var(--app-border)]'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                title={
                  step === 'session'
                    ? '진행할 상담이 없습니다'
                    : step === 'wrapup'
                      ? '마무리할 상담이 없습니다'
                      : '상담 기록이 없습니다'
                }
                description={
                  step === 'session'
                    ? '오른쪽에서 상담을 예약하거나 ① 준비에서 요약을 만드세요.'
                    : '② 진행에서 상담을 완료하면 여기에 표시됩니다.'
                }
              />
            ) : (
              <ul className="divide-y divide-[var(--app-border)] max-h-[420px] overflow-y-auto">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-violet-50/40 transition-colors flex items-center gap-3',
                        selectedId === s.id && 'bg-violet-50/60'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--app-ink)' }}>
                          {s.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                          {s.students?.name} · {COUNSELING_TYPE_LABELS[s.session_type]} ·{' '}
                          {formatScheduled(s.scheduled_at)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border',
                          COUNSELING_STATUS_STYLES[s.status]
                        )}
                      >
                        {COUNSELING_STATUS_LABELS[s.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <SessionDetailPanel
              session={selected}
              onClose={() => setSelectedId(null)}
              onStart={async () => {
                await startSession(selected.id);
              }}
              onComplete={async (summary, parentMsg, checklist) => {
                await completeSession(selected.id, summary, parentMsg, checklist);
                setToast('상담이 완료되었습니다. ③ 마무리에서 후속·학부모 전달을 확인하세요.');
                setTimeout(() => setToast(''), 4000);
              }}
              onFollowup={async (checklist) => {
                await markFollowupNeeded(selected.id, checklist);
                setToast('후속 조치가 등록되었습니다. ③ 마무리 탭에서 확인하세요.');
                setTimeout(() => setToast(''), 3500);
              }}
              onUpdateTranscript={async (patch) => {
                await updateSession(selected.id, {
                  recording_url: patch.recording_url ?? null,
                  transcript: patch.transcript ?? null,
                  summary: patch.summary,
                  transcript_source: patch.summary ? 'ai_summary' : 'manual',
                });
              }}
            />
          )}
        </div>

        <aside className={cn('space-y-4', step === 'wrapup' && 'lg:col-span-1')}>
          {step === 'session' && (
            <div
              className={cn(
                'app-card p-4 space-y-3',
                'ring-2 ring-violet-200'
              )}
            >
              <h2 className="font-bold text-sm" style={{ color: 'var(--app-ink)' }}>
                {meta.action}
              </h2>
              <select
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <option value="">학생 선택</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.grade})
                  </option>
                ))}
              </select>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CounselingSessionType)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--app-border)' }}
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="상담 제목 (선택)"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--app-border)' }}
              />
              <label className="block text-xs" style={{ color: 'var(--app-ink-3)' }}>
                예약 일시
                <input
                  type="datetime-local"
                  value={newScheduled}
                  onChange={(e) => setNewScheduled(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--app-border)' }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={!newStudentId}
                className="app-btn app-btn-primary w-full disabled:opacity-50"
              >
                상담 예약
              </button>
            </div>
          )}

          {step !== 'prep' && (
            <div className="app-card p-4">
              <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--app-ink)' }}>
                이번 주 예정
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                  예정된 상담이 없습니다.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className="w-full text-left text-xs rounded-lg border px-3 py-2 hover:border-[var(--app-accent)]"
                        style={{ borderColor: 'var(--app-border)' }}
                      >
                        <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                          {s.students?.name}
                        </p>
                        <p className="mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                          {formatScheduled(s.scheduled_at)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {actionablePendingCards.length > 0 && step === 'session' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                준비 대기 {actionablePendingCards.length}건
              </p>
              <Link
                href="/counseling?step=prep"
                className="text-xs text-amber-800 hover:underline mt-2 inline-block"
              >
                ① 준비 단계로 →
              </Link>
            </div>
          )}
        </aside>
      </div>
      )}
    </div>
  );
}
