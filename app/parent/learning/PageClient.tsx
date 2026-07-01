'use client';

import { useMemo } from 'react';
import { usePortalChild } from '@/context/PortalChildContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { buildParentRecentChanges } from '@/lib/learningFlow';
import { usePortalHomework, usePortalExams } from '@/hooks/usePortalErp';
import { ParentPortalGate } from '@/components/portal/ParentPortalGate';
import { ParentChildHeader } from '@/components/portal/ParentChildHeader';
import { ParentRecentLessons } from '@/components/portal/ParentRecentLessons';
import { ParentScoreChart } from '@/components/portal/ParentScoreChart';
import { ParentHomeworkPanel } from '@/components/portal/ParentHomeworkPanel';
import { ParentGradesPanel } from '@/components/portal/ParentGradesPanel';
import { PortalSection, PortalSubheading } from '@/components/portal/ParentUI';

function ParentLearningContent() {
  const { child } = usePortalChild();
  if (!child) return null;

  const { logs } = useLessonLogs({ studentId: child.id, limit: 30 });
  const { assignments, recentHw } = usePortalHomework(child.id, child.class_id);
  const { exams: portalExams } = usePortalExams(child.id);
  const summary = useMemo(() => generateLearningSummary(logs, child.name), [logs, child.name]);
  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  const recentChanges = buildParentRecentChanges(logs);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ParentChildHeader
        child={child}
        latestScore={scoreTrend.recentAvg}
        hwRate={hw.recentRate}
        logCount={logs.length}
        compact
      />

      <PortalSection title="이번 주 학습 요약" description="선생님이 확인한 우리 아이 학습 상태입니다.">
        <div className="space-y-6">
          <div>
            <PortalSubheading>한 줄 요약</PortalSubheading>
            <p className="text-[15px] text-stone-700 leading-relaxed parent-card-soft p-4">
              {summary || '수업 기록이 쌓이면 요약이 표시됩니다.'}
            </p>
          </div>
          {recentChanges.length > 0 && (
            <div>
              <PortalSubheading>최근 변화</PortalSubheading>
              <ul className="space-y-2">
                {recentChanges.map((line, i) => (
                  <li key={i} className="text-sm text-stone-700 pl-3 border-l-2 border-indigo-200">
                    {line.replace(/\(기록\)/g, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <PortalSubheading>최근 수업</PortalSubheading>
            <ParentRecentLessons logs={logs} />
          </div>
        </div>
      </PortalSection>

      <PortalSection title="숙제 제출 상태" description="제출·미제출 현황을 확인하세요.">
        <ParentHomeworkPanel assignments={assignments} recentHw={recentHw} />
      </PortalSection>

      <PortalSection title="최근 성적 변화" description="시험 점수와 추세입니다.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParentGradesPanel exams={portalExams} />
          <ParentScoreChart trend={scoreTrend} />
        </div>
      </PortalSection>
    </div>
  );
}

export default function ParentLearningPageClient() {
  return (
    <ParentPortalGate>{() => <ParentLearningContent />}</ParentPortalGate>
  );
}
