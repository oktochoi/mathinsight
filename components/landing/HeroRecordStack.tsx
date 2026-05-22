'use client';

import { useState } from 'react';
import { BrandFlowLineVertical } from './BrandFlowLine';

type StepId = 'hw' | 'exam' | 'memo' | 'prep';

const STEPS: {
  id: StepId;
  label: string;
  time: string;
  body: string;
  tag?: string;
}[] = [
  { id: 'hw', label: '숙제 기록', time: '3/25 21:04', body: '일차방정식 p.42 · 미제출', tag: '주의' },
  { id: 'exam', label: '시험 변화', time: '3/15 18:45', body: '모의 68점 (전주 80) · 일차방정식' },
  { id: 'memo', label: '상담 메모', time: '3/10 16:32', body: '숙제 습관·오답 정리부터 이야기' },
  { id: 'prep', label: '다음 상담 준비', time: '내일 14:00', body: '상담 카드 초안 · 부모님 숙제 루틴', tag: '활성' },
];

export function HeroRecordStack() {
  const [active, setActive] = useState<StepId>('prep');
  const current = STEPS.find((s) => s.id === active)!;

  return (
    <div className="relative w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto min-h-[420px] pb-10">
      {/* blur light behind stack */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] h-[75%] rounded-[2rem] blur-3xl opacity-70 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(30,58,95,0.12) 0%, transparent 65%)' }}
      />

      {/* scattered — back layer */}
      <div
        className="absolute top-2 -left-4 sm:-left-6 w-[42%] product-panel-muted rounded-lg px-3 py-2.5 card-lift landing-float z-[1]"
        style={{ transform: 'rotate(-7deg)' }}
      >
        <p className="text-[9px] text-stone-400 font-mono">카톡 · 3/24 20:11</p>
        <p className="text-[10px] text-stone-600 mt-1 font-light">숙제 안 냈다고…</p>
      </div>

      <div
        className="absolute top-20 -right-2 sm:right-0 w-[36%] record-sheet rounded-lg px-3 py-2.5 z-[2] card-lift landing-float-delay shadow-md"
        style={{ transform: 'rotate(5deg)' }}
      >
        <p className="text-[9px] text-stone-400">수첩 메모</p>
        <p className="text-lg font-semibold text-[#1e3a5f] tabular-nums mt-0.5">68</p>
        <p className="text-[9px] text-stone-400">전주 80</p>
      </div>

      <div
        className="absolute top-[52%] -right-4 w-[130px] record-sheet rounded-lg px-3 py-2 z-[3] hidden sm:block card-lift"
        style={{ transform: 'rotate(4deg)' }}
      >
        <p className="text-[9px] text-stone-400">상담 카드</p>
        <p className="text-[11px] text-stone-600 font-light mt-1">초안 · 3/26</p>
      </div>

      {/* main product */}
      <div className="product-panel product-panel-depth rounded-xl overflow-hidden relative z-10 mt-14 sm:mt-16 card-lift hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200/90 bg-[#f5f2ec]/80">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-300" />
            <span className="w-2 h-2 rounded-full bg-stone-300" />
            <span className="w-2 h-2 rounded-full bg-stone-300" />
          </div>
          <span className="text-[10px] text-stone-500 ml-1 font-medium">MathInsight</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-stone-500 tabular-nums">21:04</span>
          </span>
        </div>

        <div className="flex border-b border-stone-100 bg-white">
          {['흐름', '기록', '상담'].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`px-4 py-2.5 text-[11px] font-medium transition-all ${
                i === 0
                  ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] -mb-px bg-white'
                  : 'text-stone-400 hover:text-[#1e3a5f]/70 hover:bg-stone-50/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5 bg-white">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] tracking-wide text-[#1e3a5f] font-bold uppercase">학생 흐름</p>
              <h3 className="text-lg font-bold text-[#0c1222] mt-0.5 tracking-tight">박서연</h3>
              <p className="text-[11px] text-stone-400 font-light mt-0.5">고1 · A반</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#1e3a5f] text-white font-semibold shadow-sm">
              상담 전
            </span>
          </header>

          <div className="flex gap-3">
            <BrandFlowLineVertical className="w-3 shrink-0 self-stretch min-h-[210px] opacity-90" />

            <div className="flex-1 min-w-0 space-y-1.5">
              {STEPS.map((step) => {
                const isActive = active === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActive(step.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-250 group ${
                      isActive
                        ? 'bg-[#1e3a5f]/[0.08] ring-2 ring-[#1e3a5f]/20 shadow-md -translate-y-0.5'
                        : 'hover:bg-stone-50 hover:shadow-sm hover:-translate-y-px ring-1 ring-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs ${isActive ? 'font-semibold text-[#0c1222]' : 'font-medium text-stone-600'}`}
                      >
                        {step.label}
                      </span>
                      {step.tag && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            step.tag === '활성'
                              ? 'bg-[#1e3a5f] text-white'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {step.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 tabular-nums mt-0.5">{step.time}</p>
                    <p className={`text-[12px] mt-1 leading-snug ${isActive ? 'text-stone-700' : 'text-stone-500 font-light'}`}>
                      {step.body}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div key={active} className="flow-detail-enter mt-4 pt-4 border-t border-stone-100 rounded-lg bg-gradient-to-br from-stone-50 to-white px-3 py-3 ring-1 ring-stone-100/80">
            <p className="text-[10px] text-stone-400 mb-1">지금 보는 기록</p>
            <p className="text-sm text-[#0c1222] font-semibold">{current.label}</p>
            <p className="text-[12px] text-stone-500 font-light mt-1 leading-relaxed">{current.body}</p>
          </div>
        </div>
      </div>

      <aside
        className="absolute -bottom-1 left-2 sm:left-6 z-30 sticky-memo rounded-lg px-4 py-3.5 w-[min(100%,220px)] shadow-xl landing-float cursor-default card-lift"
        style={{ transform: 'rotate(-3deg)' }}
      >
        <p className="text-[9px] text-amber-900/70 font-bold uppercase tracking-wide">상담 전 메모</p>
        <p className="text-[12px] text-amber-950/90 mt-1.5 font-medium leading-relaxed">
          14:00 · 숙제 루틴부터
        </p>
        <p className="text-[9px] text-amber-800/50 tabular-nums mt-2">편집 3/26 09:12</p>
      </aside>
    </div>
  );
}
