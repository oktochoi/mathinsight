'use client';

import type { ConsultationCard } from '@/types/database';

export function ConsultationCardView({ card }: { card: ConsultationCard }) {
  const studentName = (card.students as { name?: string })?.name ?? '학생';
  const grade = (card.students as { grade?: string })?.grade;
  const savedAt = card.created_at.slice(0, 10);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 min-w-0 max-w-full">
      <div
        className="p-6 sm:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #312e81, #1e1b4b)' }}
      >
        <h2 className="text-xl font-bold">{studentName} 학생 상담 카드</h2>
        <p className="text-sm text-indigo-200/90 mt-1">
          {card.period_start} ~ {card.period_end}
          {grade ? ` · ${grade}` : ''}
        </p>
        <p className="text-xs text-indigo-200/70 mt-2">저장일 {savedAt}</p>
      </div>

      <div className="p-6 sm:p-8 space-y-7">
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-2">학습 요약</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {card.learning_summary}
          </p>
        </section>
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-2">근거 데이터</h3>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
            {card.evidence_summary}
          </pre>
        </section>
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-2">상담 포인트</h3>
          {card.consultation_points.length === 0 ? (
            <p className="text-sm text-slate-400">등록된 포인트가 없습니다.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
              {card.consultation_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-2">학부모 메시지 초안</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {card.parent_message}
          </p>
        </section>
      </div>
    </div>
  );
}
