'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection } from '@/components/student/StudentUI';
import { StudentLessonHistory } from '@/components/portal/StudentLessonHistory';
import { PageLoader } from '@/components/ui/DataStates';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const { logs, loading } = useLessonLogs({ studentId: student.id, limit: 50 });
  return (
    <div className="max-w-3xl mx-auto">
      <StudentSection title="수업 기록 전체" description={`최근 ${logs.length}건`}>
        {loading ? <PageLoader /> : <StudentLessonHistory logs={logs} />}
      </StudentSection>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
