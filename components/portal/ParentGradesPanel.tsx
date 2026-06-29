'use client';

import type { Exam, ExamScore } from '@/types/database';

export function ParentGradesPanel({
  exams,
}: {
  exams: (Exam & { score?: ExamScore })[];
}) {
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
