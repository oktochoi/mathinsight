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
    slate: '',
  };

  return (
    <div
      className={`rounded-xl border p-4 ${tone !== 'slate' ? styles[tone] : ''}`}
      style={tone === 'slate' ? { background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' } : undefined}
    >
      <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--app-ink)' }}>{title}</h4>
      <ul className="text-sm space-y-1.5 list-disc pl-4 leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
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
    <section className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>학생 요약</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
            수업 기록을 바탕으로 자동 정리된 학습 현황입니다
          </p>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>기준일 {twin.asOfDate}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <TwinSection title="강점" items={twin.strengths} tone="emerald" />
        <TwinSection title="약점" items={twin.weaknesses} tone="amber" />
        <TwinSection title="반복 패턴" items={twin.patterns} tone="sky" />
        <TwinSection title="최근 변화" items={twin.recentChanges} tone="violet" />
      </div>

      <TwinSection title="관리 필요 사항" items={twin.riskFactors} tone="slate" />
    </section>
  );
}
