'use client';

export function StudentPortalGuide() {
  const items = [
    { icon: 'ri-calendar-check-line', text: '오늘 수업·숙제 확인' },
    { icon: 'ri-line-chart-line', text: '점수·학습 흐름 보기' },
    { icon: 'ri-chat-smile-2-line', text: '선생님 피드백 읽기' },
  ];

  return (
    <div className="student-card-soft px-4 py-4 sm:px-5 h-full">
      <p className="text-xs font-semibold text-sky-700">이용 안내</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-center gap-3 text-sm text-slate-700">
            <span className="w-8 h-8 rounded-lg bg-white border border-sky-100 flex items-center justify-center shrink-0 text-sky-600">
              <i className={item.icon} aria-hidden />
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
