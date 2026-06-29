'use client';

import Link from 'next/link';
import { ConsultationBriefingCard } from '@/components/student/ConsultationBriefingCard';
import { StudentConsultationHistory } from '@/components/student/StudentConsultationHistory';
import {
  COUNSELING_STATUS_LABELS,
  COUNSELING_TYPE_LABELS,
} from '@/lib/counselingLabels';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import type { ConsultationCard, ConsultationFollowup, CounselingSession, LessonLog } from '@/types/database';
import type { StudentRiskAssessment } from '@/lib/studentRisk';

export function StudentConsultationCenter({
  studentId,
  logs,
  cards,
  followups,
  sessions,
  briefing,
  risk,
  pendingCardCount,
}: {
  studentId: string;
  logs: LessonLog[];
  cards: ConsultationCard[];
  followups: ConsultationFollowup[];
  sessions: CounselingSession[];
  briefing: { headline: string; lines: string[]; kindLabel: string };
  risk: StudentRiskAssessment | null;
  pendingCardCount: number;
}) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const cutoff = fourWeeksAgo.toISOString().slice(0, 10);
  const recent = logs.filter((l) => l.lesson_date >= cutoff);
  const scoreTrend = calculateScoreTrend(recent);
  const hwTrend = calculateHomeworkTrend(recent);
  const pendingFu = followups.filter((f) => f.status === 'pending');
  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'in_progress'
  );

  const talkPoints: string[] = [];
  if (hwTrend.recentRate < 70 && recent.length > 0) {
    talkPoints.push(`최근 숙제 완료율이 ${hwTrend.recentRate}%입니다.`);
  }
  if (scoreTrend.direction === 'down' && scoreTrend.delta != null) {
    talkPoints.push(`최근 점수 하락 흐름이 있습니다(${scoreTrend.delta}점 차이).`);
  }
  if (pendingFu.length > 0) {
    talkPoints.push(`지난 상담 이후 확인: ${pendingFu.map((f) => f.title).join(', ')}`);
  }
  if (risk?.briefingLines) {
    for (const line of risk.briefingLines) {
      if (talkPoints.length >= 4) break;
      if (!talkPoints.includes(line)) talkPoints.push(line);
    }
  }
  if (talkPoints.length === 0) {
    talkPoints.push('최근 기록을 바탕으로 학습 흐름과 목표를 나눠 보세요.');
  }

  const cautions = risk?.briefingLines.filter((l) =>
    /결석|미제출|하락|위험|주의/.test(l)
  ) ?? [];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            상담 준비
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            상담 직전에 확인하는 공간입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/counseling?step=session&student=${studentId}`}
            className="app-btn app-btn-primary text-sm"
          >
            <i className="ri-chat-smile-3-line" />
            상담 시작
          </Link>
          <Link
            href={`/consultation-cards?student=${studentId}`}
            className="app-btn app-btn-secondary text-sm"
          >
            상담 카드
          </Link>
        </div>
      </div>

      {risk && (
        <ConsultationBriefingCard
          headline={briefing.headline}
          lines={briefing.lines}
          kindLabel={briefing.kindLabel}
          kind={risk.kind}
        />
      )}

      {pendingCardCount > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <i className="ri-alert-line" />
          상담 요약 대기 {pendingCardCount}건 — 상담 후 완료 처리가 필요합니다.
        </div>
      )}

      {upcomingSessions.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink-3)' }}>
            예정·진행 중 상담
          </p>
          <ul className="space-y-2">
            {upcomingSessions.slice(0, 3).map((s) => (
              <li
                key={s.id}
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--app-accent-bg)', border: '1px solid #bfdbfe' }}
              >
                <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {s.title}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--app-ink-3)' }}>
                  {COUNSELING_TYPE_LABELS[s.session_type]} · {COUNSELING_STATUS_LABELS[s.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>
            상담 포인트
          </p>
          <ul className="space-y-1.5">
            {talkPoints.slice(0, 4).map((p, i) => (
              <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                · {p}
              </li>
            ))}
          </ul>
        </div>
        {cautions.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>
              참고 사항
            </p>
            <ul className="space-y-1.5">
              {cautions.slice(0, 3).map((c, i) => (
                <li key={i} className="text-sm leading-relaxed" style={{ color: '#b45309' }}>
                  · {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--app-ink-3)' }}>
          최근 상담
        </p>
        <StudentConsultationHistory cards={cards} />
      </div>
    </section>
  );
}
