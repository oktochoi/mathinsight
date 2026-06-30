'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { ChatFloatingWidget } from '@/components/chat/ChatFloatingWidget';

export function StudentChatFab() {
  const { student, loading } = useStudentPortal();

  if (loading || !student) return null;

  return (
    <ChatFloatingWidget
      variant="student"
      studentId={student.id}
      classId={student.class_id}
      studentName={student.name}
    />
  );
}
