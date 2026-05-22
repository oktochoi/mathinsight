import type { ReactNode } from 'react';

/** 랜딩 Hero — 학생 흐름형 floating product UI */
export function HeroDashboardPreview() {
  const exams = [
    { at: '3/8 · 19:20', score: 80, note: '일차방정식' },
    { at: '3/15 · 18:45', score: 68, note: '일차방정식' },
    { at: '3/22 · 19:10', score: 72, note: '미분계수' },
  ];

  const homework = [
    { at: '3/22', label: '완료', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
    { at: '3/25', label: '미제출', tone: 'bg-amber-500/15 text-amber-200 border-amber-500/25' },
  ];

  return (
    <div className="relative w-full max-w-[500px] mx-auto lg:mx-0 lg:ml-auto min-h-[380px] sm:min-h-[420px]">
      {/* Ambient light behind panels */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-[88%] h-[70%] rounded-[2rem] blur-3xl opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.22) 0%, transparent 68%)' }}
      />
      <div
        className="absolute bottom-6 right-0 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18), transparent 70%)' }}
      />

      {/* Floating status — 상담 예정 */}
      <div
        className="absolute -top-1 right-6 sm:right-10 z-30 landing-glass rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg"
        style={{ transform: 'rotate(1.5deg)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        <span className="text-[11px] text-slate-200 font-medium">내일 14:00 학부모 상담</span>
      </div>

      {/* Main product panel */}
      <div className="relative mt-6 landing-glass rounded-[1.35rem] overflow-hidden">
        {/* App chrome — minimal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
              박
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">박서연</p>
              <p className="text-[10px] text-slate-500 truncate">고1 · 중2 A반 · OO고</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">21:04 기록</span>
        </div>

        {/* Flow timeline */}
        <div className="px-4 py-4 sm:px-5 sm:py-5 relative">
          <p className="text-[10px] font-medium text-slate-500 mb-4 tracking-wide">
            학생 흐름 · 최근 3주
          </p>

          <div className="relative space-y-0">
            <div
              className="absolute left-[11px] top-3 bottom-3 w-px"
              style={{
                background:
                  'linear-gradient(180deg, rgba(96,165,250,0.5) 0%, rgba(148,163,184,0.25) 45%, rgba(251,191,36,0.35) 100%)',
              }}
            />

            {/* 1. 시험 흐름 */}
            <FlowStep
              dot="bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.45)]"
              title="시험 흐름"
              meta="점수 · 단원"
            >
              <div className="flex items-end gap-1 h-[52px] mb-2">
                {exams.map((e, i) => (
                  <div key={e.at} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-300 tabular-nums">{e.score}</span>
                    <div
                      className="w-full rounded-md"
                      style={{
                        height: `${e.score * 0.48}px`,
                        minHeight: 6,
                        background:
                          i === exams.length - 1
                            ? 'linear-gradient(180deg, #7dd3fc, #38bdf8)'
                            : 'rgba(100,116,139,0.45)',
                      }}
                    />
                  </div>
                ))}
              </div>
              <ul className="space-y-1">
                {exams.map((e) => (
                  <li
                    key={e.at}
                    className="flex justify-between gap-2 text-[11px] text-slate-400"
                  >
                    <span className="tabular-nums">{e.at}</span>
                    <span className="text-slate-300">
                      <span className="font-medium text-slate-200">{e.score}점</span>
                      <span className="text-slate-500"> · {e.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </FlowStep>

            {/* 2. 숙제 흐름 */}
            <FlowStep dot="bg-slate-400" title="숙제 흐름" meta="제출 상태">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {homework.map((h) => (
                  <span
                    key={h.at}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${h.tone}`}
                  >
                    {h.at} {h.label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                3/25 일차방정식 p.42 — <span className="text-amber-200/90">미제출</span>
                <span className="text-slate-600"> · 원장 메모 남김</span>
              </p>
            </FlowStep>

            {/* 3. 상담 메모 — inline in flow */}
            <FlowStep dot="bg-amber-400/90 shadow-[0_0_10px_rgba(251,191,36,0.25)]" title="상담 메모" meta="3/10 작성">
              <p className="text-[11px] text-slate-300/90 leading-[1.65] font-[350]">
                숙제 습관·오답 정리부터 이야기하기로 함. 다음 상담 때 진행 상황 확인.
              </p>
            </FlowStep>

            {/* 4. 최근 변화 */}
            <FlowStep dot="bg-violet-400/80" title="최근 변화" meta="이번 주" last>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 text-red-300/90 border border-red-500/15">
                  점수 80 → 68
                </span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-200/90 border border-amber-500/15">
                  숙제 2회 미제출
                </span>
              </div>
            </FlowStep>
          </div>
        </div>
      </div>

      {/* Sticky memo — overlaps main panel */}
      <div
        className="absolute -bottom-2 left-2 sm:left-0 z-20 w-[min(100%,240px)] landing-glass rounded-xl p-3.5 border-amber-500/15"
        style={{
          transform: 'rotate(-2.5deg)',
          background: 'rgba(251, 191, 36, 0.07)',
          boxShadow: '0 20px 40px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(251,191,36,0.12) inset',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-medium text-amber-200/80">상담 전 메모</span>
          <span className="text-[9px] text-slate-500 tabular-nums">3/10 16:32</span>
        </div>
        <p className="text-[11px] text-amber-50/75 leading-[1.6]">
          부모님께는 숙제 루틴부터, 학생에게는 오답노트부터.
        </p>
      </div>

      {/* Floating chip — 상담 카드 */}
      <div
        className="absolute top-[42%] -right-1 sm:-right-3 z-20 landing-glass rounded-lg px-2.5 py-2 hidden sm:block"
        style={{ transform: 'rotate(3deg)' }}
      >
        <p className="text-[10px] text-slate-400">상담 카드</p>
        <p className="text-[11px] font-medium text-slate-200 mt-0.5">초안 저장됨</p>
        <p className="text-[9px] text-slate-500 mt-1 tabular-nums">3/26 09:12</p>
      </div>
    </div>
  );
}

function FlowStep({
  dot,
  title,
  meta,
  children,
  last,
}: {
  dot: string;
  title: string;
  meta: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`relative pl-8 ${last ? 'pb-0' : 'pb-4'}`}>
      <span
        className={`absolute left-0 top-1.5 w-[9px] h-[9px] rounded-full ring-2 ring-[#0f1a2e] ${dot}`}
      />
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5 hover:bg-white/[0.05] transition-colors">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-slate-200">{title}</span>
          <span className="text-[9px] text-slate-500 shrink-0">{meta}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
