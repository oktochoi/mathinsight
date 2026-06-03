'use client';

export function ParentPortalGuide() {
  const items = [
    { icon: 'ri-eye-line', text: '학습 요약·최근 수업' },
    { icon: 'ri-question-answer-line', text: 'AI 질문 (학원 기록 기반)' },
    { icon: 'ri-mail-open-line', text: '원장님 안내문' },
  ];

  return (
    <div className="parent-card-soft px-4 py-4 sm:px-5 h-full">
      <p className="text-xs font-semibold text-indigo-700">이용 안내</p>
      <ul className="mt-3 space-y-2 lg:space-y-2.5">
        {items.map((item) => (
          <li
            key={item.text}
            className="flex items-center gap-3 text-sm text-stone-700 lg:text-[13px]"
          >
            <span className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 text-indigo-600">
              <i className={item.icon} aria-hidden />
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
