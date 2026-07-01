'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { usePortalExams } from '@/hooks/usePortalErp';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection } from '@/components/student/StudentUI';
import { StudentExamsPanel } from '@/components/student/StudentExamsPanel';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const { exams } = usePortalExams(student.id);
  return (
    <div className="max-w-3xl mx-auto">
      <StudentSection title="시험·점수" description="최근 시험 결과입니다.">
        <StudentExamsPanel exams={exams} />
      </StudentSection>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
