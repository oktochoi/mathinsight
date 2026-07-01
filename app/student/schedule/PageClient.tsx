'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection } from '@/components/student/StudentUI';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { usePortalClassProgress } from '@/hooks/useCurriculum';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const classIds = student.class_id ? [student.class_id] : [];
  const { progress } = usePortalClassProgress(student.class_id);
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <StudentSection title="이번 주 수업 일정" description="시간표에 등록된 수업입니다.">
        <PortalSchedule classIds={classIds} />
      </StudentSection>
      {progress && (
        <p className="text-sm text-sky-700 student-card-soft px-4 py-3">
          지금 배우는 단원: <strong>{progress.unit_name}</strong>
        </p>
      )}
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
