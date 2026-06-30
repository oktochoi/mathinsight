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
import type { Student } from '@/types/database';

type StaffProps = {
  variant: 'staff';
  initialChannelId?: string | null;
};

type ParentProps = {
  variant: 'parent';
  studentId: string;
  childName: string;
  children?: Student[];
  selectedChildId?: string;
  onChildChange?: (id: string) => void;
};

type StudentProps = {
  variant: 'student';
  studentId: string;
  classId?: string | null;
  studentName: string;
};

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
    background: 'var(--app-accent)',
    color: 'var(--app-on-accent)',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)',
  };
}

export function ChatFloatingWidget(props: Props) {
  const { profile } = useAuth();
  const { total: unreadTotal } = useChatUnread();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const title = widgetTitle(props.variant, profile?.role);
  const accent = accentStyle(props.variant);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          className="fixed inset-0 z-[52] bg-black/20 backdrop-blur-[1px] sm:bg-black/10"
          aria-label="채팅 닫기"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed z-[53] flex flex-col',
          'right-4 sm:right-6 w-[min(calc(100vw-2rem),400px)]',
          'mobile-bottom-safe',
          open ? 'bottom-[5.25rem] sm:bottom-24' : 'bottom-4 sm:bottom-6'
        )}
        style={{ maxHeight: open ? 'min(72vh, 560px)' : undefined }}
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
              className="shrink-0 flex items-center justify-between gap-3 px-4 py-3"
              style={{
                borderBottom:
                  props.variant === 'staff'
                    ? '1px solid var(--app-border)'
                    : '1px solid rgba(0,0,0,0.06)',
                background: props.variant === 'staff' ? 'var(--app-surface-2)' : '#f8fafc',
              }}
            >
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
                      href="/parent#inquiry"
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-semibold hover:opacity-70 mt-0.5 inline-block"
                      style={{ color: '#4f46e5' }}
                    >
                      학원 문의함 →
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
            </header>

            <div className="flex-1 min-h-0 overflow-hidden p-2">
              {props.variant === 'staff' ? (
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

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed z-[54] w-14 h-14 rounded-full shadow-lg',
          'flex items-center justify-center transition-all duration-200',
          'right-4 sm:right-6 mobile-bottom-safe bottom-4 sm:bottom-6',
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
    </>,
    document.body
  );
}
