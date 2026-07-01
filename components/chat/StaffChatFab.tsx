'use client';

import { useAuth } from '@/context/AuthContext';
import { isStaffProfile } from '@/lib/profileIntegrity';
import { ChatFloatingWidget } from '@/components/chat/ChatFloatingWidget';

/** 원장·강사·원무 — 로그인 시 항상 채팅 FAB 표시 */
export function StaffChatFab() {
  const { profile } = useAuth();
  if (!profile || !isStaffProfile(profile)) return null;
  return <ChatFloatingWidget variant="staff" />;
}
