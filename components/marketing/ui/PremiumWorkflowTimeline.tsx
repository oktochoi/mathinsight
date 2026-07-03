'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/cn';

type Step = { title: string; desc?: string };

const STEP_ICONS = [
  'ri-calendar-schedule-line',
  'ri-book-open-line',
  'ri-user-follow-line',
  'ri-draft-line',
  'ri-bar-chart-line',
  'ri-checkbox-circle-line',
  'ri-sparkling-2-line',
  'ri-send-plane-line',
  'ri-loop-left-line',
] as const;

const PHASES = [
  { label: '수업 기록', count: 6, tone: 'sky', from: 0, to: 5 },
  { label: 'AI 요약', count: 1, tone: 'violet', from: 6, to: 6 },
  { label: '전달 · 재등록', count: 2, tone: 'emerald', from: 7, to: 8 },
] as const;

const toneStyles = {
  sky: {
    band: 'from-sky-100/90 to-sky-50/40 border-sky-200/80',
    node: 'border-sky-300 bg-white text-sky-700 shadow-sky-200/60',
    line: 'bg-sky-300',
  },
  violet: {
    band: 'from-violet-100/90 to-indigo-50/40 border-violet-200/80',
    node: 'border-violet-400 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-400/40',
    line: 'bg-violet-300',
  },
  emerald: {
    band: 'from-emerald-100/90 to-teal-50/40 border-emerald-200/80',
    node: 'border-emerald-300 bg-white text-emerald-700 shadow-emerald-200/60',
    line: 'bg-emerald-300',
  },
} as const;

const ease = [0.22, 1, 0.36, 1] as const;

/** Product Workflow — 6·1·2 구조가 한눈에 보이는 3밴드 레일 */
export function PremiumWorkflowTimeline({
  steps,
  className,
}: {
  steps: readonly Step[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-6% 0px' });

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* 데스크톱: 3밴드 가로 레일 */}
      <div className="hidden lg:grid lg:grid-cols-[6fr_1.4fr_2fr] lg:gap-3">
        {PHASES.map((phase, phaseIndex) => {
          const phaseSteps = steps.slice(phase.from, phase.to + 1);
          const style = toneStyles[phase.tone];
          const isAi = phase.tone === 'violet';

          return (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: phaseIndex * 0.15, ease }}
              className={cn(
                'relative rounded-2xl border bg-gradient-to-b p-4 md:p-5',
                style.band
              )}
            >
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-800">{phase.label}</p>
                <span className="text-xs font-bold text-slate-500">{phase.count}단계</span>
              </div>

              <div
                className={cn(
                  'flex items-center',
                  isAi ? 'justify-center py-2' : 'flex-wrap justify-center gap-2'
                )}
              >
                {phaseSteps.map((step, i) => {
                  const globalIndex = phase.from + i;
                  return (
                    <div key={step.title} className="flex items-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{
                          duration: 0.35,
                          delay: 0.2 + globalIndex * 0.06,
                          ease,
                        }}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center rounded-2xl border shadow-md',
                            isAi ? 'h-16 w-16' : 'h-11 w-11',
                            style.node
                          )}
                        >
                          <i
                            className={cn(
                              STEP_ICONS[globalIndex] ?? 'ri-circle-line',
                              isAi ? 'text-2xl' : 'text-base'
                            )}
                            aria-hidden
                          />
                        </div>
                        <p
                          className={cn(
                            'mt-2 text-center font-semibold text-slate-700',
                            isAi ? 'text-sm' : 'text-[11px] max-w-[4.5rem] leading-tight'
                          )}
                        >
                          {step.title}
                        </p>
                      </motion.div>
                      {!isAi && i < phaseSteps.length - 1 && (
                        <motion.span
                          className={cn('mx-1 h-0.5 w-3 rounded-full', style.line)}
                          initial={{ scaleX: 0 }}
                          animate={inView ? { scaleX: 1 } : {}}
                          transition={{ delay: 0.35 + globalIndex * 0.06, duration: 0.25 }}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {phaseIndex < PHASES.length - 1 && (
                <motion.i
                  className="ri-arrow-right-s-line absolute -right-4 top-1/2 z-10 -translate-y-1/2 text-2xl text-slate-300"
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + phaseIndex * 0.12, duration: 0.35, ease }}
                  aria-hidden
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 모바일: 세로 3밴드 */}
      <div className="space-y-3 lg:hidden">
        {PHASES.map((phase, phaseIndex) => {
          const phaseSteps = steps.slice(phase.from, phase.to + 1);
          const style = toneStyles[phase.tone];
          const isAi = phase.tone === 'violet';

          return (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: phaseIndex * 0.12, ease }}
              className={cn('rounded-2xl border bg-gradient-to-r p-4', style.band)}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-extrabold text-slate-800">{phase.label}</p>
                <span className="text-xs font-bold text-slate-500">{phase.count}단계</span>
              </div>
              <div className={cn('flex flex-wrap gap-2', isAi && 'justify-center py-1')}>
                {phaseSteps.map((step, i) => {
                  const globalIndex = phase.from + i;
                  return (
                    <motion.span
                      key={step.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.15 + globalIndex * 0.05, duration: 0.3, ease }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm',
                        isAi
                          ? 'border-violet-300 bg-violet-600 text-white'
                          : 'border-white/80 bg-white/90 text-slate-700'
                      )}
                    >
                      <i className={STEP_ICONS[globalIndex]} aria-hidden />
                      {step.title}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
