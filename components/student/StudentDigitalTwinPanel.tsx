'use client';

import { useMemo } from 'react';
import type { ConsultationCard, ConsultationFollowup, LessonLog } from '@/types/database';
import { buildStudentDigitalTwin } from '@/lib/studentDigitalTwin';

function TwinSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'emerald' | 'amber' | 'sky' | 'violet' | 'slate';
}) {
  const styles = {
    emerald: 'border-emerald-100 bg-emerald-50/50',
    amber: 'border-amber-100 bg-amber-50/50',
    sky: 'border-sky-100 bg-sky-50/50',
    violet: 'border-violet-100 bg-violet-50/50',
    slate: 'border-slate-100 bg-slate-50/50',
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[tone]}`}>
      <h4 className="text-xs font-bold text-slate-800 mb-2">{title}</h4>
      <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function StudentDigitalTwinPanel({
  logs,
  cards = [],
  followups = [],
}: {
  logs: LessonLog[];
  cards?: ConsultationCard[];
  followups?: ConsultationFollowup[];
}) {
  const twin = useMemo(
    () => buildStudentDigitalTwin(logs, { cards, followups }),
    [logs, cards, followups]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Student Digital Twin</h3>
          <p className="text-xs text-slate-500 mt-1">
            수업 기록을 바탕으로 자동 갱신되는 학습 프로필(기록 기준, 판단 최소화)
          </p>
        </div>
        <span className="text-[10px] text-slate-400">기준일 {twin.asOfDate}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <TwinSection title="강점" items={twin.strengths} tone="emerald" />
        <TwinSection title="약점" items={twin.weaknesses} tone="amber" />
        <TwinSection title="반복 패턴" items={twin.patterns} tone="sky" />
        <TwinSection title="최근 변화" items={twin.recentChanges} tone="violet" />
      </div>

      <TwinSection title="위험 요소 (기록 신호)" items={twin.riskFactors} tone="slate" />
    </section>
  );
}
