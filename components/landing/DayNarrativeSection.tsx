import type { ReactNode } from 'react';
import { BrandFlowLineVertical } from './BrandFlowLine';
import { LandingQuote } from './LandingDepth';

type Step = {
  id: string;
  chapter: string;
  title: string;
  body: string;
  aside?: ReactNode;
  rotate?: string;
};

const STEPS: Step[] = [
  {
    id: 'scattered',
    chapter: '01',
    title: '흩어진 기록',
    body: '출결은 단톡방에, 점수는 수첩에, 지난 상담은 메모장에. 기록은 쌓이지만 한곳에 있지 않습니다.',
    rotate: '-2deg',
    aside: (
      <div className="space-y-2">
        {[
          { label: '카톡 3/24 20:11', r: '-4deg', y: 0 },
          { label: '수첩 p.12', r: '3deg', y: 8 },
          { label: '엑셀 백업', r: '-1deg', y: 4 },
        ].map((item) => (
          <div
            key={item.label}
            className="product-panel-muted rounded-lg px-3 py-2.5 card-lift hover:shadow-lg transition-all"
            style={{ transform: `rotate(${item.r}) translateX(${item.y}px)` }}
          >
            <p className="text-[11px] text-stone-500 font-light">{item.label}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'before',
    chapter: '02',
    title: '상담 직전',
    body: '내일 14시 학부모 상담. 지난번에 무엇을 말했는지, 요즘 숙제는 어땠는지 — 다시 찾아야 합니다.',
    aside: (
      <div
        className="sticky-memo rounded-lg px-4 py-3.5 card-lift hover:shadow-xl transition-all ml-auto max-w-[200px]"
        style={{ transform: 'rotate(2deg)' }}
      >
        <p className="text-[10px] text-amber-900/70 font-bold">14:00 상담</p>
        <p className="text-xs text-amber-950/90 mt-1 font-medium">박서연 어머니</p>
        <p className="text-[9px] text-amber-800/50 tabular-nums mt-2">알림 3/26 08:00</p>
      </div>
    ),
  },
  {
    id: 'search',
    chapter: '03',
    title: '다시 찾는 과정',
    body: '카톡을 뒤집고, 수업 로그를 떠올리고, “그때 뭐라고 했더라”를 반복합니다.',
  },
  {
    id: 'flow',
    chapter: '04',
    title: '정리된 흐름',
    body: '숙제 → 시험 → 상담 메모가 한 줄로 이어집니다. 날짜순으로 펼쳐 읽습니다.',
    aside: (
      <div
        className="product-panel rounded-lg p-4 text-[11px] space-y-2.5 card-lift hover:shadow-xl ml-auto"
        style={{ transform: 'rotate(-1deg)' }}
      >
        <p className="text-stone-600">
          <span className="text-[#1e3a5f] font-bold">숙제</span>{' '}
          <span className="text-stone-400 tabular-nums">3/25</span> 미제출
        </p>
        <p className="text-stone-600">
          <span className="text-[#1e3a5f] font-bold">시험</span>{' '}
          <span className="text-stone-400 tabular-nums">3/15</span>{' '}
          <span className="font-semibold text-[#0c1222]">68</span>점
        </p>
        <p className="text-stone-600 border-t border-stone-100 pt-2.5">
          <span className="text-[#1e3a5f] font-bold">상담</span>{' '}
          <span className="text-stone-400 tabular-nums">3/10</span> 메모
        </p>
      </div>
    ),
  },
  {
    id: 'ready',
    chapter: '05',
    title: '상담 준비 완료',
    body: '말할 순서가 보입니다. 이미 남긴 기록을 다시 읽는 시간이 짧아집니다.',
  },
];

export function DayNarrativeSection() {
  return (
    <section id="day" className="scroll-mt-20 relative py-12 sm:py-16 px-4 sm:px-8 lg:px-12">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(30,58,95,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12 mb-10 sm:mb-12 items-end">
          <div>
            <p className="text-[11px] tracking-[0.12em] uppercase text-[#1e3a5f] font-bold mb-3">
              원장의 하루
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold landing-ink leading-[1.15] tracking-[-0.03em]">
              기록을{' '}
              <span className="landing-hero-accent text-2xl sm:text-3xl">이어서</span>{' '}
              읽습니다
            </h2>
          </div>
          <p className="text-sm text-stone-400/90 font-light leading-[1.8] lg:pb-1">
            기능 목록이 아니라, 상담 전후에 시간이 어떻게 줄어드는지.
          </p>
        </div>

        {/* rhythm break — big quote */}
        <div className="mb-12 sm:mb-14 py-10 sm:py-12 px-6 sm:px-10 rounded-2xl bg-white/70 border border-stone-200/60 shadow-sm relative overflow-hidden">
          <div
            className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.15)' }}
          />
          <LandingQuote sub="상담 직전, 매번 반복되는 일">
            상담 전에 다시 찾는 시간.
          </LandingQuote>
        </div>

        <div className="relative flex gap-6 lg:gap-10">
          <div className="hidden sm:block w-4 shrink-0 relative">
            <BrandFlowLineVertical className="absolute inset-0 w-full min-h-full opacity-100" />
          </div>

          <div className="flex-1 space-y-10 sm:space-y-12">
            {STEPS.map((step, index) => (
              <div key={step.id}>
                <article
                  id={step.id}
                  className="relative grid sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)] gap-6 sm:gap-8 items-start"
                >
                  <span
                    className="absolute -left-9 sm:-left-11 top-1 w-7 h-7 rounded-full bg-[#1e3a5f] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-md hidden sm:flex"
                    aria-hidden
                  >
                    {step.chapter}
                  </span>

                  <div>
                    <span className="text-[11px] text-stone-400 font-light sm:hidden">{step.chapter}</span>
                    <h3 className="mt-1 sm:mt-0 text-xl font-bold landing-ink tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm text-stone-400/95 font-light leading-[1.8] max-w-md">
                      {step.body}
                    </p>
                  </div>

                  {step.aside && (
                    <div className="sm:justify-self-end w-full max-w-[210px] relative z-[1]">
                      {step.aside}
                    </div>
                  )}
                </article>

                {index === 2 && (
                  <div className="my-10 sm:my-12 text-center py-8 border-y border-dashed border-stone-300/60">
                    <p className="text-4xl sm:text-5xl font-bold text-[#1e3a5f]/15 tabular-nums">12</p>
                    <p className="text-xs text-stone-400 font-light mt-2 tracking-wide">
                      분 · 평균 상담 준비에서 기록 확인에 쓰는 시간
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
