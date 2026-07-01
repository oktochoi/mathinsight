'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { ChatFloatingWidget } from '@/components/chat/ChatFloatingWidget';

/** 학생 — 학원 연결 전에도 FAB 표시 */
export function StudentChatFab() {
  const { student, loading } = useStudentPortal();

  const blockedMessage = loading
    ? '학생 정보를 불러오는 중입니다…'
    : !student
      ? '채팅을 이용하려면 먼저 학원에 연결해 주세요.'
      : undefined;

  const academyName =
    (student as { academies?: { name: string } } | null)?.academies?.name ?? '학원';

  return (
    <ChatFloatingWidget
      variant="student"
      studentId={student?.id ?? 'pending'}
      classId={student?.class_id}
      studentName={student?.name ?? '학생'}
      academyName={academyName}
      blockedMessage={blockedMessage}
      aboveBottomNav
    />
  );
}
