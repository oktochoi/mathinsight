'use client';

import { useStudentPortal } from '@/context/StudentPortalContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend, getRecentUnits } from '@/lib/analytics';
import { buildStudentProgressLines } from '@/lib/studentPortalInsights';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection, StudentSubheading } from '@/components/student/StudentUI';
import { StudentCharts } from '@/components/student/StudentCharts';

function Content() {
  const { student } = useStudentPortal();
  if (!student) return null;
  const { logs } = useLessonLogs({ studentId: student.id, limit: 30 });
  const summary = generateLearningSummary(logs, student.name);
  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  const recentUnits = getRecentUnits(logs, 5);
  const progressLines = buildStudentProgressLines(logs);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <StudentSection title="학습 요약" description="요약·점수·숙제 추이">
        <StudentSubheading>한 줄 요약</StudentSubheading>
        <p className="text-[15px] text-slate-700 leading-relaxed student-card-soft p-4">{summary}</p>
        {recentUnits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {recentUnits.map((u) => (
              <span key={u} className="text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {u}
              </span>
            ))}
          </div>
        )}
        <div className="mt-8">
          <StudentCharts
            scoreTrend={scoreTrend}
            scoreChart={scoreTrend.points}
            hwChart={hw.weeklyRates.filter((w) => w.rate > 0 || logs.length > 0)}
          />
        </div>
        <div className="mt-8">
          <StudentSubheading>최근 변화</StudentSubheading>
          <ul className="space-y-2">
            {progressLines.map((line, i) => (
              <li key={i} className="text-sm text-slate-700 pl-3 border-l-2 border-sky-300">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </StudentSection>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
