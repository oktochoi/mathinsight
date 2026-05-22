/** 랜딩 Hero용 — 실제 상담 전에 보는 학생 카드 예시 (그래프 없음) */
export function ConsultationCardPreview({ className = '' }: { className?: string }) {
  const exams = [
    { date: '3/8', unit: '일차방정식', score: '80점' },
    { date: '3/15', unit: '일차방정식', score: '68점' },
    { date: '3/22', unit: '미분계수', score: '72점' },
  ];
  const homework = [
    { date: '3/15', status: '미제출', tone: 'text-amber-700 bg-amber-50' },
    { date: '3/18', status: '부분', tone: 'text-slate-600 bg-slate-100' },
    { date: '3/22', status: '완료', tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          상담 전에 보는 화면 · 예시
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
            박
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">박서연</p>
            <p className="text-xs text-slate-500">고1 · 중2 A반 · OO고</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5 text-sm">
        <section>
          <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <i className="ri-file-list-3-line text-slate-400"></i>
            최근 시험·점수
          </h4>
          <ul className="space-y-1.5">
            {exams.map((row) => (
              <li
                key={row.date}
                className="flex justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 text-slate-700"
              >
                <span>
                  {row.date} · {row.unit}
                </span>
                <span className="font-semibold text-slate-900 shrink-0">{row.score}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <i className="ri-book-2-line text-slate-400"></i>
            최근 숙제
          </h4>
          <ul className="space-y-1.5">
            {homework.map((row) => (
              <li
                key={row.date}
                className="flex justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50"
              >
                <span className="text-slate-600">{row.date}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${row.tone}`}>
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <i className="ri-stack-line text-slate-400"></i>
            최근 단원
          </h4>
          <p className="text-slate-700 px-2.5 py-2 rounded-lg bg-slate-50 leading-relaxed">
            일차방정식 → 미분계수 (3월 2주차)
          </p>
        </section>

        <section className="rounded-xl border border-amber-100 bg-amber-50/80 p-3.5">
          <h4 className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
            <i className="ri-chat-3-line"></i>
            지난 상담 메모
          </h4>
          <p className="text-xs text-amber-900/90 leading-relaxed">
            3/10 — 숙제 습관·오답 정리부터 이야기하기로 함. 다음 상담 때 진행 상황 확인.
          </p>
        </section>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/80 rounded-b-2xl">
        <p className="text-[11px] text-slate-500 text-center">
          카톡·수첩을 뒤집지 않고, 한 장에서 확인
        </p>
      </div>
    </div>
  );
}
