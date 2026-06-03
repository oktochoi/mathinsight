'use client';

export function StudentStudyTips({ tips }: { tips: string[] }) {
  return (
    <div className="student-card overflow-hidden">
      <div className="px-5 py-4 border-b border-sky-100 bg-sky-600">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <i className="ri-lightbulb-line" aria-hidden />
          오늘의 학습 포인트
        </h2>
        <p className="text-xs text-sky-100 mt-1">기록을 바탕으로 추천해요</p>
      </div>
      <ul className="p-4 space-y-2.5">
        {tips.map((tip, i) => (
          <li
            key={i}
            className="text-sm text-slate-800 leading-relaxed flex gap-2.5 student-card-soft p-3.5"
          >
            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
