'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection } from '@/components/student/StudentUI';
import { ParentNoticesPanel } from '@/components/portal/ParentNoticesPanel';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const { items } = usePortalAnnouncements(student.id, student.class_id);
  return (
    <div className="max-w-3xl mx-auto">
      <StudentSection title="학원 공지" description="선생님이 올린 안내입니다.">
        <ParentNoticesPanel items={items} />
      </StudentSection>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
