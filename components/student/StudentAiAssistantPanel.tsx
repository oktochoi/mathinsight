'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ConsultationCard, ConsultationFollowup, LessonLog } from '@/types/database';
import { StudentDigitalTwinPanel } from '@/components/student/StudentDigitalTwinPanel';
import { buildConsultationBriefing } from '@/lib/consultationBriefing';
import type { Student } from '@/types/database';
import { StatusBadge } from '@/components/data-ui/StatusBadge';

/** 학생 상세 2단 — AI Assistant 보조 패널 */
export function StudentAiAssistantPanel({
  student,
  logs,
  cards,
  followups,
}: {
  student: Student;
  logs: LessonLog[];
  cards?: ConsultationCard[];
  followups?: ConsultationFollowup[];
}) {
  const briefing = useMemo(
    () => (logs.length > 0 ? buildConsultationBriefing(student, logs, cards ?? [], followups ?? []) : null),
    [student, logs, cards, followups]
  );

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-indigo-100 p-5" style={{ background: 'var(--app-surface-2)' }}>
        <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
          수업 기록이 쌓이면 AI 학생 요약과 상담 준비 메모가 표시됩니다.
        </p>
        <Link
          href="/lesson-logs"
          className="inline-block mt-3 text-xs font-semibold hover:underline"
          style={{ color: 'var(--app-accent)' }}
        >
          오늘 수업 입력 →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
          <i className="ri-sparkling-2-line text-indigo-600 text-sm" />
        </span>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>AI 학생 요약</h2>
          <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>운영 판단을 돕는 보조 정보</p>
        </div>
        <StatusBadge label="운영 지원" tone="ai" size="sm" className="ml-auto" />
      </div>

      {briefing && (
        <div className="rounded-xl border border-indigo-100 p-4" style={{ background: 'var(--app-surface)' }}>
          <p className="text-xs font-semibold text-indigo-700 mb-2">상담 준비 메모</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>{briefing.headline}</p>
          <ul className="mt-2 space-y-1">
            {briefing.lines.slice(0, 4).map((line, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--app-ink-2)' }}>
                <span className="text-indigo-400 shrink-0">·</span>
                {line}
              </li>
            ))}
          </ul>
          <Link
            href={`/counseling?step=prep&student=${student.id}`}
            className="inline-block mt-3 text-xs font-semibold hover:underline"
            style={{ color: 'var(--app-accent)' }}
          >
            상담 준비 화면 →
          </Link>
        </div>
      )}

      <StudentDigitalTwinPanel logs={logs} cards={cards} followups={followups} />
    </div>
  );
}
