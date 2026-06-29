'use client';

import type { ConsultationFollowup, LessonLog } from '@/types/database';
import { computeStudentBadges } from '@/lib/studentBadges';
import { assessStudentRisk } from '@/lib/studentRisk';
import { StudentRiskBadge } from '@/components/student/StudentRiskBadge';

/** 학생 목록 — 「최근 학습 현황」 한 칸에 표시 */
export function StudentSignalCell({
  logs,
  followups = [],
  pendingConsultations = 0,
}: {
  logs: LessonLog[];
  followups?: ConsultationFollowup[];
  pendingConsultations?: number;
}) {
  const risk = assessStudentRisk(logs, { followups });
  const showDetail = risk.kind !== 'stable';
  const badges = computeStudentBadges(logs, followups).filter((b) => b.type !== 'stable');
  const topHint = showDetail ? badges[0]?.reason : undefined;

  if (logs.length === 0) {
    return <span className="text-xs text-slate-400">수업 기록 없음</span>;
  }

  return (
    <div className="space-y-1 max-w-[220px]">
      <StudentRiskBadge kind={risk.kind} kindLabel={risk.kindLabel} compact />
      {pendingConsultations > 0 && (
        <p className="text-[10px] text-amber-700 font-medium">상담 요약 대기 {pendingConsultations}건</p>
      )}
      {topHint && (
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2" title={topHint}>
          {topHint}
        </p>
      )}
    </div>
  );
}
