'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { usePortalHomework } from '@/hooks/usePortalErp';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection } from '@/components/student/StudentUI';
import { StudentHomeworkPanel } from '@/components/student/StudentHomeworkPanel';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const { assignments, recentHw } = usePortalHomework(student.id, student.class_id);
  return (
    <div className="max-w-3xl mx-auto">
      <StudentSection title="이번 주 숙제" description="마감일과 제출 상태를 확인하세요.">
        <StudentHomeworkPanel assignments={assignments} recentHw={recentHw} />
      </StudentSection>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
