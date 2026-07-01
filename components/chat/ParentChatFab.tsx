'use client';

import { usePortalChild } from '@/context/PortalChildContext';
import { ChatFloatingWidget } from '@/components/chat/ChatFloatingWidget';

/** 학부모 — 자녀 연결 전에도 FAB 표시 */
export function ParentChatFab() {
  const { child, children, selectedId, setSelectedId, loading } = usePortalChild();

  const blockedMessage = loading
    ? '자녀 정보를 불러오는 중입니다…'
    : !child
      ? '채팅을 이용하려면 먼저 자녀를 연결해 주세요.'
      : undefined;

  const academyName =
    (child as { academies?: { name: string } } | null)?.academies?.name ?? '학원';

  return (
    <ChatFloatingWidget
      variant="parent"
      studentId={child?.id ?? 'pending'}
      childName={child?.name ?? '자녀'}
      academyName={academyName}
      children={children}
      selectedChildId={selectedId}
      onChildChange={setSelectedId}
      blockedMessage={blockedMessage}
      aboveBottomNav
    />
  );
}
