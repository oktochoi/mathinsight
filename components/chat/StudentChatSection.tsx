'use client';

import { StudentChatInbox } from '@/components/chat/StudentChatInbox';
import type { Student } from '@/types/database';

export function StudentChatSection({ student }: { student: Student }) {
  return (
    <div className="min-h-[min(420px,60vh)] student-card-soft p-3 sm:p-4">
      <StudentChatInbox
        studentId={student.id}
        classId={student.class_id}
        studentName={student.name}
      />
    </div>
  );
}
