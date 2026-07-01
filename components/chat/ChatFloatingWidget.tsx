'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { fromDbRole } from '@/lib/roles';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { StaffChatInbox, StaffChatFullPageLink } from '@/components/chat/StaffChatInbox';
import { ParentChatInbox } from '@/components/chat/ParentChatInbox';
import { StudentChatInbox } from '@/components/chat/StudentChatInbox';
import { PortalAgentChatEmbed } from '@/components/chat/PortalAgentChatEmbed';
import { StaffAgentChatEmbed } from '@/components/chat/StaffAgentChatEmbed';
import type { Student } from '@/types/database';

type ChatPanelMode = 'human' | 'ai';

type PortalLayoutProps = {
  /** 모바일 하단 탭바 위로 FAB 올리기 */
  aboveBottomNav?: boolean;
};

type StaffProps = {
  variant: 'staff';
  initialChannelId?: string | null;
} & PortalLayoutProps;

type PortalChatProps = {
  /** 채팅 불가 시에도 FAB는 표시하고 패널에 안내 문구를 띄웁니다 */
  blockedMessage?: string;
} & PortalLayoutProps;

type ParentProps = {
  variant: 'parent';
  studentId: string;
  childName: string;
  academyName?: string;
  children?: Student[];
  selectedChildId?: string;
  onChildChange?: (id: string) => void;
} & PortalChatProps;

type StudentProps = {
  variant: 'student';
  studentId: string;
  classId?: string | null;
  studentName: string;
  academyName?: string;
} & PortalChatProps;

type Props = StaffProps | ParentProps | StudentProps;

function widgetTitle(variant: Props['variant'], staffRole: string | undefined) {
  if (variant === 'parent') return '채팅';
  if (variant === 'student') return '채팅';
  const app = fromDbRole(staffRole);
  if (app === 'owner' || app === 'desk') return '메시지';
  if (app === 'teacher') return '내 학생 · 반 톡';
  return '메시지';
}

function accentStyle(variant: Props['variant']) {
  if (variant === 'student') {
    return {
      background: '#0284c7',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(2, 132, 199, 0.45)',
    };
  }
  if (variant === 'parent') {
    return {
      background: '#4f46e5',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(79, 70, 229, 0.45)',
    };
  }
  return {
    background: '#2563eb',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)',
  };
}

const CHAT_HINT_KEYS: Record<Props['variant'], string> = {
  staff: 'eduflow_chat_hint_seen_staff',
  parent: 'eduflow_chat_hint_seen_parent',
  student: 'eduflow_chat_hint_seen_student',
};

const CHAT_HINT_TEXT: Record<Props['variant'], string> = {
  staff: '여기서 학부모·강사와 채팅할 수 있어요',
  parent: '선생님과 바로 채팅할 수 있어요',
  student: '반 톡방·담당 선생님과 채팅할 수 있어요',
};

const FAB_BOTTOM = 'max(1rem, env(safe-area-inset-bottom, 0px))';
/** ParentBottomTabBar / StudentBottomTabBar 높이(h-14) + 여백 */
const PORTAL_TAB_OFFSET = '4.25rem';

function fabBottomCss(aboveBottomNav?: boolean, panelOpen?: boolean): string {
  const fabH = '3.5rem';
  if (aboveBottomNav) {
    if (panelOpen) {
      return `calc(${PORTAL_TAB_OFFSET} + ${FAB_BOTTOM} + ${fabH})`;
    }
    return `calc(${PORTAL_TAB_OFFSET} + ${FAB_BOTTOM})`;
  }
  if (panelOpen) {
    return `calc(${FAB_BOTTOM} + 4.5rem)`;
  }
  return FAB_BOTTOM;
}

function ChatModeTabs({
  mode,
  onChange,
  variant,
}: {
  mode: ChatPanelMode;
  onChange: (m: ChatPanelMode) => void;
  variant: Props['variant'];
}) {
  const isStaff = variant === 'staff';
  return (
    <div
      className="flex gap-1 p-1 rounded-lg shrink-0"
      style={{ background: isStaff ? 'var(--app-surface-2)' : '#f1f5f9' }}
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'human'}
        onClick={() => onChange('human')}
        className={cn(
          'flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors',
          mode === 'human' ? 'shadow-sm' : 'opacity-70'
        )}
        style={
          mode === 'human'
            ? { background: isStaff ? 'var(--app-surface)' : '#fff', color: isStaff ? 'var(--app-ink)' : '#0f172a' }
            : { color: isStaff ? 'var(--app-ink-3)' : '#64748b' }
        }
      >
        {variant === 'staff' ? '메시지' : '선생님과 대화'}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'ai'}
        onClick={() => onChange('ai')}
        className={cn(
          'flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors',
          mode === 'ai' ? 'shadow-sm' : 'opacity-70'
        )}
        style={
          mode === 'ai'
            ? { background: isStaff ? 'var(--app-surface)' : '#fff', color: isStaff ? 'var(--app-ink)' : '#0f172a' }
            : { color: isStaff ? 'var(--app-ink-3)' : '#64748b' }
        }
      >
        AI 도우미
      </button>
    </div>
  );
}

export function ChatFloatingWidget(props: Props) {
  const { profile } = useAuth();
  const { total: unreadTotal } = useChatUnread();
  const [open, setOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<ChatPanelMode>('human');
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const aboveBottomNav = props.aboveBottomNav ?? false;
  const title = widgetTitle(props.variant, profile?.role);
  const accent = accentStyle(props.variant);
  const blockedMessage =
    props.variant === 'parent' || props.variant === 'student' ? props.blockedMessage : undefined;
  const chatReady =
    props.variant === 'staff' ||
    (!blockedMessage && props.studentId.length > 0 && props.studentId !== 'pending');
  const aiReady =
    props.variant === 'staff' ||
    (!blockedMessage && props.studentId.length > 0 && props.studentId !== 'pending');

  useEffect(() => {
    if (!open) setPanelMode('human');
  }, [open]);

  useEffect(() => {
    setMounted(true);
    const key = CHAT_HINT_KEYS[props.variant];
    try {
      if (!localStorage.getItem(key)) setShowHint(true);
    } catch {
      setShowHint(true);
    }
  }, [props.variant]);
  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem(CHAT_HINT_KEYS[props.variant], '1');
    } catch {
      /* ignore */
    }
  };

  const fabBottomMobile = fabBottomCss(aboveBottomNav, false);
  const fabBottomDesktop = fabBottomCss(false, false);
  const panelBottomMobile = fabBottomCss(aboveBottomNav, true);
  const panelBottomDesktop = fabBottomCss(false, true);

  const fabPositionClass = aboveBottomNav
    ? '[bottom:var(--chat-fab-bottom-mobile)] lg:[bottom:var(--chat-fab-bottom-desktop)]'
    : '[bottom:var(--chat-fab-bottom-desktop)]';

  const panelPositionClass = aboveBottomNav
    ? '[bottom:var(--chat-panel-bottom-mobile)] lg:[bottom:var(--chat-panel-bottom-desktop)]'
    : '[bottom:var(--chat-panel-bottom-desktop)]';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-[1px] sm:bg-black/10"
          aria-label="채팅 닫기"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed z-[100] flex flex-col',
          'right-4 sm:right-6 w-[min(calc(100vw-2rem),400px)]',
          panelPositionClass
        )}
        style={
          {
            '--chat-fab-bottom-mobile': fabBottomMobile,
            '--chat-fab-bottom-desktop': fabBottomDesktop,
            '--chat-panel-bottom-mobile': panelBottomMobile,
            '--chat-panel-bottom-desktop': panelBottomDesktop,
            maxHeight: open ? 'min(72vh, 560px)' : undefined,
          } as React.CSSProperties
        }
      >
        {open && (
          <div
            className="flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-200"
            style={{
              background: props.variant === 'staff' ? 'var(--app-surface)' : '#fff',
              border:
                props.variant === 'staff'
                  ? '1px solid var(--app-border)'
                  : '1px solid rgba(0,0,0,0.08)',
              height: 'min(72vh, 560px)',
            }}
            role="dialog"
            aria-label={title}
          >
            <header
              className="shrink-0 flex flex-col gap-2 px-4 py-3"
              style={{
                borderBottom:
                  props.variant === 'staff'
                    ? '1px solid var(--app-border)'
                    : '1px solid rgba(0,0,0,0.06)',
                background: props.variant === 'staff' ? 'var(--app-surface-2)' : '#f8fafc',
              }}
            >
              <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-bold"
                  style={{ color: props.variant === 'staff' ? 'var(--app-ink)' : '#0f172a' }}
                >
                  {title}
                </p>
                {props.variant === 'parent' && (
                  <>
                    {props.children && props.children.length > 1 && props.onChildChange ? (
                      <select
                        value={props.selectedChildId ?? props.studentId}
                        onChange={(e) => props.onChildChange?.(e.target.value)}
                        className="mt-1 text-[11px] font-medium rounded-lg border px-2 py-0.5 max-w-full"
                        style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#334155' }}
                      >
                        {props.children.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[10px] truncate" style={{ color: '#64748b' }}>
                        {props.childName}
                      </p>
                    )}
                    <Link
                      href="/parent"
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-semibold hover:opacity-70 mt-0.5 inline-block"
                      style={{ color: '#4f46e5' }}
                    >
                      학부모 포털 홈 →
                    </Link>
                  </>
                )}
                {props.variant === 'student' && (
                  <p className="text-[10px] truncate" style={{ color: '#64748b' }}>
                    {props.studentName}
                  </p>
                )}
                {props.variant === 'staff' && fromDbRole(profile?.role) === 'teacher' && (
                  <p className="text-[10px]" style={{ color: 'var(--app-ink-3)' }}>
                    담당 학생·반 톡방만 표시됩니다
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {props.variant === 'staff' && <StaffChatFullPageLink />}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                  style={{ color: props.variant === 'staff' ? 'var(--app-ink-3)' : '#64748b' }}
                  aria-label="닫기"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>
              </div>
              <ChatModeTabs mode={panelMode} onChange={setPanelMode} variant={props.variant} />
            </header>

            <div className="flex-1 min-h-0 overflow-hidden p-2">
              {panelMode === 'ai' ? (
                props.variant === 'staff' ? (
                  <StaffAgentChatEmbed />
                ) : !aiReady ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
                    <i className="ri-robot-2-line text-3xl opacity-40" aria-hidden />
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-3, #64748b)' }}>
                      {blockedMessage ?? 'AI 도우미를 준비하는 중입니다.'}
                    </p>
                  </div>
                ) : (
                  <PortalAgentChatEmbed
                    studentId={props.studentId}
                    studentName={
                      props.variant === 'parent' ? props.childName : props.studentName
                    }
                    academyName={props.academyName}
                    audience={props.variant === 'student' ? 'student' : 'parent'}
                  />
                )
              ) : !chatReady ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
                  <i className="ri-chat-3-line text-3xl opacity-40" aria-hidden />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-3, #64748b)' }}>
                    {blockedMessage ?? '채팅을 준비하는 중입니다.'}
                  </p>
                  {props.variant === 'parent' && (
                    <Link
                      href="/parent"
                      onClick={() => setOpen(false)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      자녀 연결하러 가기 →
                    </Link>
                  )}
                  {props.variant === 'student' && (
                    <Link
                      href="/student/settings"
                      onClick={() => setOpen(false)}
                      className="text-xs font-semibold text-sky-600 hover:underline"
                    >
                      학원 연결하러 가기 →
                    </Link>
                  )}
                </div>
              ) : props.variant === 'staff' ? (
                <StaffChatInbox initialChannelId={props.initialChannelId} compact />
              ) : props.variant === 'parent' ? (
                <ParentChatInbox
                  key={props.studentId}
                  studentId={props.studentId}
                  childName={props.childName}
                  compact
                />
              ) : (
                <StudentChatInbox
                  studentId={props.studentId}
                  classId={props.classId}
                  studentName={props.studentName}
                  compact
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn('fixed z-[101] right-4 sm:right-6', fabPositionClass)}
        style={
          {
            '--chat-fab-bottom-mobile': fabBottomMobile,
            '--chat-fab-bottom-desktop': fabBottomDesktop,
          } as React.CSSProperties
        }
      >
        {showHint && !open && (
          <div
            className="absolute bottom-full right-0 mb-2 w-[min(240px,calc(100vw-3rem))] rounded-xl px-3 py-2 text-left text-[11px] leading-snug shadow-lg"
            style={{ background: 'var(--app-ink, #1c1917)', color: '#fff' }}
            role="status"
          >
            {CHAT_HINT_TEXT[props.variant]}
            <button
              type="button"
              onClick={dismissHint}
              className="block mt-1 text-[10px] underline opacity-80 cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            dismissHint();
            setOpen((v) => !v);
          }}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg',
            'flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95'
          )}
          style={accent}
          aria-label={open ? '채팅 닫기' : '채팅 열기'}
          aria-expanded={open}
        >
          <span className="relative flex items-center justify-center w-full h-full">
            <i className={cn('text-2xl', open ? 'ri-close-line' : 'ri-chat-3-fill')} aria-hidden />
            {!open && unreadTotal > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white border-2 border-white"
                aria-label={`읽지 않은 메시지 ${unreadTotal}개`}
              >
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </span>
        </button>
      </div>
    </>,
    document.body
  );
}
