'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStudentPortal } from '@/context/StudentPortalContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { generateLearningSummary } from '@/lib/reportGenerator';
import { calculateHomeworkTrend, calculateScoreTrend, getRecentUnits } from '@/lib/analytics';
import { buildStudentProgressLines } from '@/lib/studentPortalInsights';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';
import { StudentSection, StudentSubheading } from '@/components/student/StudentUI';
import { StudentCharts } from '@/components/student/StudentCharts';
import { StudentLessonHistory } from '@/components/portal/StudentLessonHistory';
import { PageLoader } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

type Tab = 'summary' | 'history';

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="flex gap-2 border-b border-sky-100 mb-6">
      {(
        [
          { key: 'summary' as const, label: '학습 요약' },
          { key: 'history' as const, label: '수업 기록' },
        ] as const
      ).map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onTab(t.key)}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            tab === t.key
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab: Tab = searchParams.get('tab') === 'history' ? 'history' : 'summary';
  const { student } = useStudentPortal();

  if (!student) return null;

  const { logs, loading } = useLessonLogs({ studentId: student.id, limit: 50 });
  const summaryLogs = logs.slice(0, 30);
  const summary = generateLearningSummary(summaryLogs, student.name);
  const scoreTrend = calculateScoreTrend(summaryLogs);
  const hw = calculateHomeworkTrend(summaryLogs);
  const recentUnits = getRecentUnits(summaryLogs, 5);
  const progressLines = buildStudentProgressLines(summaryLogs);

  const setTab = (next: Tab) => {
    router.replace(next === 'summary' ? '/student/learning' : '/student/learning?tab=history');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <TabBar tab={tab} onTab={setTab} />

      {tab === 'summary' ? (
        <StudentSection title="학습 요약" description="요약·점수·숙제 추이">
          <StudentSubheading>한 줄 요약</StudentSubheading>
          <p className="text-[15px] text-slate-700 leading-relaxed student-card-soft p-4">{summary}</p>
          {recentUnits.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {recentUnits.map((u) => (
                <span
                  key={u}
                  className="text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200"
                >
                  {u}
                </span>
              ))}
            </div>
          )}
          <div className="mt-8">
            <StudentCharts
              scoreTrend={scoreTrend}
              scoreChart={scoreTrend.points}
              hwChart={hw.weeklyRates.filter((w) => w.rate > 0 || summaryLogs.length > 0)}
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
      ) : (
        <StudentSection title="수업 기록 전체" description={`최근 ${logs.length}건`}>
          {loading ? <PageLoader /> : <StudentLessonHistory logs={logs} />}
        </StudentSection>
      )}
    </div>
  );
}

function ContentWithSearchParams() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Content />
    </Suspense>
  );
}

export default function PageClient() {
  return (
    <StudentPortalGate>{() => <ContentWithSearchParams />}</StudentPortalGate>
  );
}
