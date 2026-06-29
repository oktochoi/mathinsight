'use client';

import Link from 'next/link';
import { consultationCardPath } from '@/lib/documentRoutes';
import type { ConsultationCard, LessonLog, Student } from '@/types/database';
import { calculateHomeworkTrend, calculateScoreTrend, getRecentUnits } from '@/lib/analytics';
import { computeStudentBadges } from '@/lib/studentBadges';
import { buildConsultationBriefing } from '@/lib/consultationBriefing';
import { assessStudentRisk } from '@/lib/studentRisk';
import { countPendingConsultations, getLatestConsultationCard } from '@/lib/consultationStatus';
import { ConsultationStatusBadge } from '@/components/consultation/ConsultationStatusBadge';
import { buildPostConsultationChanges } from '@/lib/learningFlow';
import { ConsultationBriefingCard } from '@/components/student/ConsultationBriefingCard';
import { CounselingAgentPanel } from '@/components/student/CounselingAgentPanel';
import { HOMEWORK_LABELS } from '@/lib/statusLabels';
import { StudentBadges } from '@/components/student/StudentBadges';
import type { ConsultationFollowup } from '@/types/database';

export function ConsultationPrepPanel({
  student,
  logs,
  cards,
  followups,
}: {
  student: Student;
  logs: LessonLog[];
  cards: ConsultationCard[];
  followups: ConsultationFollowup[];
}) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const cutoff = fourWeeksAgo.toISOString().slice(0, 10);
  const recent = logs.filter((l) => l.lesson_date >= cutoff);
  const scoreTrend = calculateScoreTrend(recent);
  const hwTrend = calculateHomeworkTrend(recent);
  const units = getRecentUnits(recent, 4);
  const badges = computeStudentBadges(logs, followups);
  const latestCard = getLatestConsultationCard(cards);
  const latestCompleted = getLatestConsultationCard(cards, { completedOnly: true });
  const pendingCards = countPendingConsultations(cards);
  const pendingFu = followups.filter((f) => f.status === 'pending');
  const sinceConsult = buildPostConsultationChanges(logs, latestCompleted, followups);
  const briefing = buildConsultationBriefing(student, logs, cards, followups);
  const risk = assessStudentRisk(logs, { followups, lastCard: latestCompleted });

  const talkPoints: string[] = [];
  if (hwTrend.recentRate < 70 && recent.length > 0) {
    talkPoints.push(
      `최근 숙제 완료율이 ${hwTrend.recentRate}%입니다. 기록을 함께 살보면 좋겠습니다.`
    );
  }
  if (scoreTrend.direction === 'down' && scoreTrend.delta != null) {
    talkPoints.push(
      `최근 점수 하락 흐름이 있습니다(기록 기준 ${scoreTrend.delta}점 차이).`
    );
  }
  if (pendingFu.length > 0) {
    talkPoints.push(`지난 상담 이후 확인할 내용: ${pendingFu.map((f) => f.title).join(', ')}`);
  }
  const memos = recent.filter((l) => l.memo?.trim()).slice(0, 3);
  if (memos.length > 0) {
    talkPoints.push(`최근 수업 메모 ${memos.length}건이 있습니다.`);
  }
  if (talkPoints.length === 0) {
    talkPoints.push('최근 기록을 바탕으로 학습 흐름과 목표를 나눠 보세요.');
  }

  return (
    <div className="rounded-2xl border border-indigo-100 p-5 sm:p-6 space-y-5" style={{ background: 'var(--app-surface)' }}>
      <CounselingAgentPanel studentId={student.id} studentName={student.name} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>상담 준비 모드</h3>
        <Link href={`/consultation-cards?student=${student.id}`}>
          <span className="text-xs hover:underline cursor-pointer" style={{ color: 'var(--app-accent)' }}>
            상담 카드 만들기 →
          </span>
        </Link>
      </div>

      <ConsultationBriefingCard
        headline={briefing.headline}
        lines={briefing.lines}
        kindLabel={briefing.kindLabel}
        kind={risk.kind}
      />

      <StudentBadges badges={badges} />

      {pendingCards > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center gap-2">
          <ConsultationStatusBadge status="pending" />
          <span>
            상담 카드 {pendingCards}건이 <strong>대기</strong> 상태입니다. 상담 후 카드 상세에서
            「상담 완료 처리」를 눌러 주세요.
          </span>
        </div>
      )}

      {sinceConsult.length > 0 && (
        <div className="rounded-xl p-4 border border-indigo-100" style={{ background: 'var(--app-surface-2)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-accent)' }}>지난 상담 이후 (기록)</p>
          <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: 'var(--app-ink-2)' }}>
            {sinceConsult.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--app-ink-3)' }}>최근 4주 점수</p>
          {scoreTrend.points.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--app-ink-4)' }}>점수 기록 없음</p>
          ) : (
            <p style={{ color: 'var(--app-ink-2)' }}>
              {scoreTrend.recentAvg != null ? `최근 평균 ${scoreTrend.recentAvg}점` : '-'}
              {scoreTrend.delta != null && (
                <span style={{ color: 'var(--app-ink-3)' }}> · 변화 {scoreTrend.delta}점(기록)</span>
              )}
            </p>
          )}
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--app-ink-3)' }}>최근 숙제</p>
          <p style={{ color: 'var(--app-ink-2)' }}>완료율 {hwTrend.recentRate}% (기록 기준)</p>
        </div>
      </div>

      {units.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--app-ink-2)' }}>
          <span className="font-medium">최근 단원:</span> {units.join(' → ')}
        </p>
      )}

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>상담 시 참고 포인트</p>
        <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: 'var(--app-ink-2)' }}>
          {talkPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      {latestCard && (
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--app-ink)' }}>학부모 메시지 초안 (최근 상담 카드)</p>
            <Link
              href={consultationCardPath(latestCard.id)}
              className="text-[10px] hover:underline shrink-0"
              style={{ color: 'var(--app-accent)' }}
            >
              저장 카드 보기 →
            </Link>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-4" style={{ color: 'var(--app-ink-2)' }}>
            {latestCard.parent_message || '—'}
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-ink)' }}>최근 수업 기록</p>
        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto" style={{ color: 'var(--app-ink-2)' }}>
          {recent.slice(0, 6).map((l) => (
            <li key={l.id}>
              {l.lesson_date} · {l.unit || '수업'} · {HOMEWORK_LABELS[l.homework_status]}
              {l.test_score != null ? ` · ${l.test_score}점` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
