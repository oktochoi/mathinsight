'use client';

import { useState } from 'react';
import { BrandFlowLineHorizontal } from './BrandFlowLine';

const FLOW = [
  {
    id: 'hw',
    label: '숙제 기록',
    sub: '3/25 미제출',
    detail: '일차방정식 p.42 — 원장 메모: 오답 3문제 확인',
    time: '3/25 21:04',
  },
  {
    id: 'exam',
    label: '시험 변화',
    sub: '80 → 68',
    detail: '3/15 일차방정식 모의 68점. 전주 80점 대비 하락.',
    time: '3/15 18:45',
  },
  {
    id: 'memo',
    label: '상담 메모',
    sub: '3/10 작성',
    detail: '숙제 습관·오답 정리부터. 다음 상담 때 진행 확인.',
    time: '3/10 16:32',
  },
  {
    id: 'prep',
    label: '다음 상담 준비',
    sub: '내일 14:00',
    detail: '박서연 어머니 — 숙제 루틴, 최근 점수 흐름, 지난 약속 점검.',
    time: '상담 카드 초안 3/26',
  },
] as const;

type FlowId = (typeof FLOW)[number]['id'];

export function StudentFlowTrack() {
  const [active, setActive] = useState<FlowId>('prep');
  const current = FLOW.find((f) => f.id === active)!;

  return (
    <div className="product-panel product-panel-depth rounded-xl overflow-hidden card-lift hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200/80 bg-gradient-to-r from-[#f5f2ec] to-white">
        <span className="text-[11px] font-bold text-[#1e3a5f]">학생 흐름</span>
        <span className="text-[10px] text-stone-400 tabular-nums">박서연 · 21:04</span>
      </div>

      <div className="p-4 sm:p-5 relative">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[80%] h-16 blur-2xl bg-[#3b82f6]/10 pointer-events-none rounded-full" />

        <div className="relative mb-4 h-3 hidden sm:block">
          <BrandFlowLineHorizontal className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-3" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {FLOW.map((step, i) => {
            const isActive = active === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(step.id)}
                className={`flow-step text-left rounded-lg px-3 py-3 transition-all duration-250 border card-lift ${
                  isActive
                    ? 'border-[#1e3a5f]/30 bg-[#1e3a5f]/[0.07] shadow-lg shadow-[#1e3a5f]/10 -translate-y-1 ring-2 ring-[#1e3a5f]/15'
                    : 'border-stone-200/90 bg-white hover:border-[#3b82f6]/25 hover:shadow-md hover:-translate-y-0.5'
                }`}
                style={!isActive && i % 2 === 1 ? { transform: 'rotate(0.5deg)' } : undefined}
              >
                <span className="text-[9px] text-[#1e3a5f]/50 font-semibold tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className={`text-xs mt-1 ${isActive ? 'font-bold text-[#0c1222]' : 'font-medium text-stone-700'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5 font-light">{step.sub}</p>
              </button>
            );
          })}
        </div>

        <div key={active} className="flow-detail-enter mt-5 rounded-xl border border-[#1e3a5f]/15 bg-white px-4 py-4 shadow-md ring-1 ring-stone-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">
              {current.label}
            </span>
            <time className="text-[10px] text-stone-400 tabular-nums">{current.time}</time>
          </div>
          <p className="text-[13px] text-stone-600 font-light leading-[1.7]">{current.detail}</p>
        </div>
      </div>
    </div>
  );
}
