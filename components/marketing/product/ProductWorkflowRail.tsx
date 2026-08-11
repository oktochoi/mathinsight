'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * 6 → 1 → 2 워크플로 — 컬러 밴드 카드가 아니라 하나의 헤어라인 레일.
 * 9단계가 끊기지 않은 한 줄 위에 놓여야 "따로 쓰는 기능 9개"가 아니라 "하나의 흐름"으로 읽힌다.
 * AI(7번째)는 크기를 키우지 않고 보라 라벨 하나로만 구분한다 — 운영 60 · AI 25 · 상담 15.
 * 스크롤에 따라 레일이 왼쪽에서 오른쪽으로 그려지며, 진행 상태는 transform/opacity만 사용한다.
 */

type Step = { title: string };

const PHASES = [
  { label: '수업 기록', span: 6, note: '매일 하는 입력' },
  { label: 'AI 요약', span: 1, note: '상담 직전 한 번' },
  { label: '전달 · 재등록', span: 2, note: '학부모와 판단' },
] as const;

const AI_INDEX = 6;

function stepTone(index: number) {
  if (index === AI_INDEX) return 'text-violet-700';
  if (index >= 7) return 'text-emerald-700';
  return 'text-slate-900';
}

function RailStep({
  index,
  total,
  title,
  progress,
}: {
  index: number;
  total: number;
  title: string;
  progress: MotionValue<number>;
}) {
  const markOpacity = useTransform(progress, (p) => {
    const reached = (p * total - index) / 0.6;
    return 0.3 + Math.min(1, Math.max(0, reached)) * 0.7;
  });

  return (
    <div className="border-l border-slate-200 px-3 pt-4">
      <motion.span
        style={{ opacity: markOpacity }}
        className={cn('block text-[11px] font-bold tabular-nums', stepTone(index))}
      >
        {String(index + 1).padStart(2, '0')}
      </motion.span>
      <p className="mt-1.5 text-[13px] font-semibold leading-tight text-slate-800">{title}</p>
    </div>
  );
}

export function ProductWorkflowRail({ steps }: { steps: readonly Step[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 88%', 'end 62%'],
  });
  const lineScale = useTransform(scrollYProgress, (p) => Math.min(1, Math.max(0.04, p)));

  return (
    <div ref={ref}>
      {/* 데스크톱 — 9단계가 하나의 가로 레일 위에 */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-9">
          {PHASES.map((phase, i) => (
            <div
              key={phase.label}
              className={cn('pb-3', i > 0 && 'border-l border-slate-200 pl-3')}
              style={{ gridColumn: `span ${phase.span} / span ${phase.span}` }}
            >
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.16em]',
                  phase.label === 'AI 요약' ? 'text-violet-700' : 'text-slate-500'
                )}
              >
                {phase.label}
                <span className="ml-2 font-semibold tabular-nums text-slate-400">
                  {phase.span}단계
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">{phase.note}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
          <motion.div
            style={{ scaleX: lineScale, willChange: 'transform' }}
            className="absolute inset-x-0 top-0 h-px origin-left bg-emerald-600"
          />
          <div className="grid grid-cols-9">
            {steps.map((step, i) => (
              <RailStep
                key={step.title}
                index={i}
                total={steps.length}
                title={step.title}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 — 같은 순서를 세로 헤어라인으로 */}
      <div className="lg:hidden">
        {PHASES.map((phase, phaseIndex) => {
          const from = PHASES.slice(0, phaseIndex).reduce((acc, p) => acc + p.span, 0);
          return (
            <div key={phase.label} className="border-t border-slate-200 py-5 first:border-t-0 first:pt-0">
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.16em]',
                  phase.label === 'AI 요약' ? 'text-violet-700' : 'text-slate-500'
                )}
              >
                {phase.label}
                <span className="ml-2 font-semibold tabular-nums text-slate-400">
                  {phase.span}단계
                </span>
              </p>
              <ul className="mt-3 space-y-2">
                {steps.slice(from, from + phase.span).map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[26px_1fr] items-baseline gap-2">
                    <span
                      className={cn('text-[11px] font-bold tabular-nums', stepTone(from + i))}
                    >
                      {String(from + i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[15px] text-slate-800">{step.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
