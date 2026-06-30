'use client';

import type { PortalExamWithScore } from '@/hooks/usePortalErp';

export function ParentGradesPanel({ exams }: { exams: PortalExamWithScore[] }) {
  if (exams.length === 0) {
    return (
      <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">
        등록된 시험 성적이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {exams.map((exam) => (
        <li key={exam.id} className="parent-card-soft p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm">{exam.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {exam.exam_date}
              {exam.unit_scope ? ` · ${exam.unit_scope}` : ''}
            </p>
            {exam.classRank && (
              <p className="text-xs mt-2 text-stone-600">
                반 평균 {exam.classRank.classAvg}점
                <span
                  className={`ml-1 font-medium ${
                    exam.classRank.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  ({exam.classRank.delta >= 0 ? '+' : ''}
                  {exam.classRank.delta})
                </span>
                <span className="ml-2 inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold">
                  상위 {exam.classRank.topPct}% · {exam.classRank.rank}/{exam.classRank.total}위
                </span>
              </p>
            )}
            {exam.score?.feedback_memo && (
              <p className="text-sm text-stone-600 mt-2">{exam.score.feedback_memo}</p>
            )}
          </div>
          <p className="text-2xl font-bold text-indigo-700 tabular-nums shrink-0">
            {exam.score?.score != null ? `${exam.score.score}` : '—'}
            <span className="text-xs font-normal text-stone-400 ml-0.5">점</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
