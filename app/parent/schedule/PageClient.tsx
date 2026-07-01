'use client';

import { usePortalChild } from '@/context/PortalChildContext';
import type { Student } from '@/types/database';
import { ParentPortalGate } from '@/components/portal/ParentPortalGate';
import { ParentChildHeader } from '@/components/portal/ParentChildHeader';
import { ParentScheduleContent } from '@/components/portal/ParentPortalSecondaryPanels';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';

function Content() {
  const { child } = usePortalChild();
  if (!child) return null;
  const academyName =
    (child as Student & { academies?: { name: string } })?.academies?.name ?? '학원';
  const { logs } = useLessonLogs({ studentId: child.id, limit: 1 });
  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ParentChildHeader child={child} latestScore={scoreTrend.recentAvg} hwRate={hw.recentRate} logCount={logs.length} compact />
      <ParentScheduleContent classId={child.class_id} academyName={academyName} />
    </div>
  );
}

export default function PageClient() {
  return <ParentPortalGate>{() => <Content />}</ParentPortalGate>;
}
