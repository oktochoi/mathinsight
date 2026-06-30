'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useParentMessagesStaff } from '@/hooks/useParentMessages';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner, EmptyState } from '@/components/ui/DataStates';
import { Toast } from '@/components/ui/Toast';
import { KpiMetric } from '@/components/data-ui/KpiMetric';
import { StatusBadge } from '@/components/data-ui/StatusBadge';
import { STAFF_PAGES } from '@/lib/staffPages';
import { StaffChatSection } from '@/components/chat/StaffChatSection';
import { cn } from '@/lib/cn';
import type { ParentMessage } from '@/types/database';

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MessagesPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const embedded = pathname?.includes('/parent-hub');
  const studentFilter = searchParams.get('student');
  const pageMode = searchParams.get('mode') === 'chat' ? 'chat' : 'inquiry';
  const chatChannel = searchParams.get('channel');

  const { messages, loading, error, replyMessage, saveAiDraft } = useParentMessagesStaff();
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { message: toast, show: showToast } = useToast(2500);

  const pendingCount = useMemo(
    () => messages.filter((m) => m.status === 'pending').length,
    [messages]
  );
  const answeredCount = useMemo(
    () => messages.filter((m) => m.status === 'answered').length,
    [messages]
  );

  const filtered = useMemo(() => {
    let list = messages;
    if (studentFilter) list = list.filter((m) => m.student_id === studentFilter);
    if (filter !== 'all') list = list.filter((m) => m.status === filter);
    return list;
  }, [messages, filter, studentFilter]);

  const selected = messages.find((m) => m.id === selectedId);

  const openMessage = (m: ParentMessage) => {
    setSelectedId(m.id);
    setReply(m.staff_reply ?? m.ai_draft_reply ?? '');
    setMobileDetail(true);
  };

  useEffect(() => {
    if (selectedId && filtered.some((m) => m.id === selectedId)) return;
    const first = filtered.find((m) => m.status === 'pending') ?? filtered[0];
    if (first) {
      setSelectedId(first.id);
      setReply(first.staff_reply ?? first.ai_draft_reply ?? '');
    } else {
      setSelectedId(null);
      setReply('');
      setMobileDetail(false);
    }
  }, [filtered, selectedId]);

  const handleAiDraft = async () => {
    if (!selected?.student_id) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/messages/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selected.student_id,
          subject: selected.subject,
          question: selected.body,
        }),
      });
      const data = (await res.json()) as { ok: boolean; draft?: string };
      if (data.ok && data.draft) {
        setReply(data.draft);
        await saveAiDraft(selected.id, data.draft);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    const result = await replyMessage(selected.id, reply, selected.ai_draft_reply ?? undefined);
    setSaving(false);
    if (result.error) {
      showToast(result.error);
      return;
    }
    showToast('답변이 저장되었습니다.');
  };

  if (loading) return <PageLoader />;

  const studentFilterLabel = studentFilter
    ? messages.find((m) => m.student_id === studentFilter)?.students?.name
    : null;

  return (
    <div className="space-y-5 w-full min-w-0 max-w-full">
      {!embedded && <PageHeader title={STAFF_PAGES.messages.title} />}

      {error && <ErrorBanner message={error} />}
      <Toast message={toast} />

      {!embedded && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['inquiry', '문의함', embedded ? '/parent-hub?tab=messages' : '/messages'],
              ['chat', '채팅', embedded ? '/parent-hub?tab=messages&mode=chat' : '/messages?mode=chat'],
            ] as const
          ).map(([mode, label, href]) => (
            <Link
              key={mode}
              href={href}
              className={cn(
                'text-sm px-4 py-2 rounded-full border font-semibold transition-colors',
                pageMode === mode ? 'app-badge-info border-[var(--app-accent-border)]' : ''
              )}
              style={
                pageMode === mode
                  ? undefined
                  : { background: 'var(--app-surface)', color: 'var(--app-ink-3)', borderColor: 'var(--app-border)' }
              }
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {pageMode === 'chat' ? (
        <StaffChatSection initialChannelId={chatChannel} />
      ) : (
        <>

      {studentFilterLabel && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span style={{ color: 'var(--app-ink-2)' }}>
            <strong style={{ color: 'var(--app-ink)' }}>{studentFilterLabel}</strong> 학생 문의만 표시 중
          </span>
          <Link
            href={embedded ? '/parent-hub?tab=messages' : '/messages'}
            className="text-xs font-semibold hover:opacity-70"
            style={{ color: 'var(--app-accent)' }}
          >
            전체 보기
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiMetric
          label="답변 대기"
          value={pendingCount}
          unit="건"
          icon="ri-mail-unread-line"
          accent="orange"
          size="sm"
        />
        <KpiMetric
          label="답변 완료"
          value={answeredCount}
          unit="건"
          icon="ri-mail-check-line"
          accent="green"
          size="sm"
        />
        <div className="col-span-2 lg:col-span-1">
          <KpiMetric
            label="전체 문의"
            value={messages.length}
            unit="건"
            icon="ri-inbox-line"
            accent="slate"
            size="sm"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[min(72vh,720px)]">
        {/* 문의 목록 */}
        <section
          className={cn(
            'flex flex-col rounded-2xl overflow-hidden min-h-[320px] lg:min-h-0',
            'w-full lg:w-[min(100%,380px)] lg:shrink-0',
            mobileDetail && 'hidden lg:flex'
          )}
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}>
            <p className="app-label">받은 문의</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(
                [
                  ['pending', '대기', pendingCount],
                  ['answered', '완료', answeredCount],
                  ['all', '전체', messages.length],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all cursor-pointer"
                  style={
                    filter === key
                      ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)', borderColor: 'var(--app-ink)' }
                      : { background: 'var(--app-surface)', color: 'var(--app-ink-3)', borderColor: 'var(--app-border)' }
                  }
                >
                  {label}
                  <span className="ml-1 tabular-nums opacity-80">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                title={filter === 'pending' ? '대기 중인 문의가 없습니다' : '문의가 없습니다'}
                description="학부모 포털에서 들어온 문의가 여기에 표시됩니다."
              />
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto overscroll-contain">
              {filtered.map((m) => {
                const isActive = selectedId === m.id;
                return (
                  <li key={m.id} style={{ borderBottom: '1px solid var(--app-border)' }}>
                    <button
                      type="button"
                      onClick={() => openMessage(m)}
                      className="w-full text-left px-4 py-3.5 transition-colors border-l-[3px] cursor-pointer"
                      style={
                        isActive
                          ? { background: 'var(--app-accent-bg)', borderLeftColor: 'var(--app-accent)' }
                          : { background: 'transparent', borderLeftColor: 'transparent' }
                      }
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm line-clamp-1 flex-1 min-w-0" style={{ color: 'var(--app-ink)' }}>
                          {m.subject}
                        </p>
                        <StatusBadge
                          label={m.status === 'pending' ? '대기' : '완료'}
                          tone={m.status === 'pending' ? 'warning' : 'success'}
                          size="sm"
                          dot
                        />
                      </div>
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>{m.body}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 text-[11px]" style={{ color: 'var(--app-ink-4)' }}>
                        <span className="truncate">
                          {m.students?.name ?? '학생'} · {m.parent_user?.name ?? '학부모'}
                        </span>
                        <time className="shrink-0 tabular-nums">{formatMessageTime(m.created_at)}</time>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 답변 패널 */}
        <section
          className={cn(
            'flex flex-col flex-1 min-w-0 rounded-2xl overflow-hidden',
            !mobileDetail && !selected && 'hidden lg:flex'
          )}
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--app-surface-2)' }}
              >
                <i className="ri-mail-open-line text-2xl" style={{ color: 'var(--app-ink-4)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--app-ink-2)' }}>문의를 선택하세요</p>
              <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--app-ink-3)' }}>
                왼쪽 목록에서 학부모 문의를 선택하면 내용 확인과 답변이 가능합니다.
              </p>
            </div>
          ) : (
            <>
              <div
                className="px-4 py-3 flex items-start gap-3"
                style={{ borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
              >
                <button
                  type="button"
                  onClick={() => setMobileDetail(false)}
                  className="lg:hidden shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-3)' }}
                  aria-label="목록으로"
                >
                  <i className="ri-arrow-left-line" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={selected.status === 'pending' ? '답변 대기' : '답변 완료'}
                      tone={selected.status === 'pending' ? 'warning' : 'success'}
                      dot
                    />
                    <span className="text-xs tabular-nums" style={{ color: 'var(--app-ink-4)' }}>
                      {formatMessageTime(selected.created_at)}
                    </span>
                  </div>
                  <h2
                    className="text-base sm:text-lg font-bold mt-1 break-words"
                    style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}
                  >
                    {selected.subject}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
                    {selected.students?.name && selected.student_id ? (
                      <Link
                        href={`/students/${selected.student_id}`}
                        className="font-semibold hover:underline"
                        style={{ color: 'var(--app-accent)' }}
                      >
                        {selected.students.name}
                      </Link>
                    ) : (
                      (selected.students?.name ?? '학생')
                    )}
                    {' · '}
                    {selected.parent_user?.name ?? '학부모'}
                    {selected.parent_user?.email ? ` (${selected.parent_user.email})` : ''}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 min-h-0">
                <div>
                  <p className="app-label mb-2">학부모 문의</p>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                      {selected.body}
                    </p>
                  </div>
                </div>

                {selected.staff_reply && selected.status === 'answered' && (
                  <div>
                    <p className="app-label mb-2">보낸 답변</p>
                    <div className="rounded-xl px-4 py-3 app-inline-success">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                        {selected.staff_reply}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="app-label">
                      {selected.status === 'answered' ? '답변 수정' : '답변 작성'}
                    </label>
                    {selected.student_id && (
                      <button
                        type="button"
                        onClick={() => void handleAiDraft()}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50 cursor-pointer hover:opacity-70"
                        style={{ color: 'var(--app-accent)' }}
                      >
                        <i className="ri-sparkling-2-line" />
                        {aiLoading ? 'AI 작성 중…' : 'AI 답변 초안'}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={7}
                    className="w-full min-h-[140px] rounded-xl px-3 py-2.5 text-sm resize-y"
                    style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)', outline: 'none' }}
                    placeholder="학부모에게 보낼 답변을 작성하세요."
                  />
                </div>
              </div>

              <div
                className="shrink-0 px-4 py-3 flex flex-wrap gap-2 justify-end"
                style={{ borderTop: '1px solid var(--app-border)', background: 'var(--app-surface)' }}
              >
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={saving || !reply.trim()}
                  className="app-btn app-btn-primary disabled:opacity-50 min-h-[44px]"
                >
                  {saving ? '저장 중…' : selected.status === 'answered' ? '답변 수정 저장' : '답변 완료'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
        </>
      )}
    </div>
  );
}
