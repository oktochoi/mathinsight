'use client';

import type { PortalExamWithScore } from '@/hooks/usePortalErp';

export function StudentExamsPanel({ exams }: { exams: PortalExamWithScore[] }) {
  if (exams.length === 0) {
    return (
      <p className="text-sm text-center py-6 student-card-soft" style={{ color: 'var(--app-ink-3)' }}>
        시험 점수가 아직 없어요.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {exams.map((exam) => (
        <li
          key={exam.id}
          className="student-card-soft p-4 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-bold" style={{ color: 'var(--app-ink)' }}>{exam.name}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>{exam.exam_date}</p>
            {exam.classRank && (
              <p className="text-xs mt-2" style={{ color: 'var(--app-ink-2)' }}>
                반 평균 {exam.classRank.classAvg}점
                <span
                  className="ml-1 font-medium"
                  style={{ color: exam.classRank.delta >= 0 ? 'var(--app-success)' : 'var(--app-danger)' }}
                >
                  ({exam.classRank.delta >= 0 ? '+' : ''}
                  {exam.classRank.delta})
                </span>
                <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold app-inline-success">
                  상위 {exam.classRank.topPct}% · {exam.classRank.rank}/{exam.classRank.total}위
                </span>
              </p>
            )}
            {exam.score?.feedback_memo && (
              <p className="text-sm text-sky-800 mt-2">{exam.score.feedback_memo}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-sky-600 tabular-nums">
              {exam.score?.score ?? '—'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>/ {exam.max_score}점</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
