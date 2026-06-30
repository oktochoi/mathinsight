'use client';

import { usePortalChild } from '@/context/PortalChildContext';
import { ChatFloatingWidget } from '@/components/chat/ChatFloatingWidget';

export function ParentChatFab() {
  const { child, children, selectedId, setSelectedId, loading } = usePortalChild();

  if (loading || !child) return null;

  return (
    <ChatFloatingWidget
      variant="parent"
      studentId={child.id}
      childName={child.name}
      children={children}
      selectedChildId={selectedId}
      onChildChange={setSelectedId}
    />
  );
}
