'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MarketingScreenMockup } from '@/components/marketing/ui/MarketingScreenMockup';

/**
 * "원장의 하루" — 대시보드 로그인 → 오늘 수업 기록(흩어진 신호가 하나로 수렴) → AI 브리핑 →
 * 상담 → 학생·학부모 포털까지 이어지는 단일 스크롤 시퀀스. 원장이 하루 동안 실제로 거치는
 * 흐름을 그대로 보여준다.
 *
 * 각 막은 화면 전체를 하나의 장면으로 쓴다 — 작은 카드가 넓은 여백 가운데 떠 있는 구성을
 * 피하고, 텍스트가 주인공인 순간은 타이포그래피를 크게, 제품이 주인공인 순간은 실제 화면
 * (MarketingScreenMockup)을 큰 스케일로 그대로 노출한다.
 */

const ACT_COUNT = 5;
const GAP = 0.035;
const WIDE = 'mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16';

/** 2막(수렴)은 흩어짐→하나로 모이는 애니메이션이 있어 더 많은 스크롤 여유가 필요하고,
 * 마지막 막(포털)도 하루의 마무리인 만큼 조금 더 여유를 준다. 전체적으로 스크롤이 너무 빨리
 * 지나간다는 피드백에 따라 기존 비율은 유지한 채 전체 길이를 약 1.6배 늘렸다. */
const ACT_WEIGHTS = [1.6, 2.6, 1.6, 1.6, 1.9] as const;
const TOTAL_WEIGHT = ACT_WEIGHTS.reduce((a, b) => a + b, 0);

function bandFor(index: number): [number, number] {
  let before = 0;
  for (let i = 0; i < index; i++) before += ACT_WEIGHTS[i];
  return [before / TOTAL_WEIGHT, (before + ACT_WEIGHTS[index]) / TOTAL_WEIGHT];
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t);
}

/**
 * 다중 브레이크포인트 배열 형태의 useTransform은 이 프로젝트의 framer-motion 버전에서
 * 구간 밖 입력을 기대만큼 0/1로 완전히 clamp하지 않는 현상이 확인되어(막이 안 사라지고
 * 옅게 남아 다음 막과 겹쳐 보임), 함수형 트랜스폼으로 직접 clamp 로직을 계산한다.
 */
function useActOpacity(scrollYProgress: MotionValue<number>, index: number) {
  const [start, end] = bandFor(index);
  const fadeIn = start + GAP;
  const fadeOut = end - GAP;

  return useTransform(scrollYProgress, (p) => {
    if (index === 0) {
      if (p <= fadeOut) return 1;
      return clamp01(1 - (p - fadeOut) / (end - fadeOut));
    }
    if (index === ACT_COUNT - 1) {
      if (p >= fadeIn) return 1;
      return clamp01((p - start) / (fadeIn - start));
    }
    if (p <= start || p >= end) return 0;
    if (p < fadeIn) return clamp01((p - start) / (fadeIn - start));
    if (p > fadeOut) return clamp01(1 - (p - fadeOut) / (end - fadeOut));
    return 1;
  });
}

function useActY(scrollYProgress: MotionValue<number>, index: number) {
  const [start, end] = bandFor(index);
  const fadeIn = start + GAP;
  const fadeOut = end - GAP;

  return useTransform(scrollYProgress, (p) => {
    if (p <= start) return 28;
    if (p >= end) return -28;
    if (p < fadeIn) return lerp(28, 0, (p - start) / (fadeIn - start));
    if (p > fadeOut) return lerp(0, -28, (p - fadeOut) / (end - fadeOut));
    return 0;
  });
}

function useLocalProgress(scrollYProgress: MotionValue<number>, index: number) {
  const [start, end] = bandFor(index);
  return useTransform(scrollYProgress, (p) => clamp01((p - start) / (end - start)));
}

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'ai' | 'onDark' }) {
  return (
    <p
      className={cn(
        'text-sm font-bold uppercase tracking-[0.2em]',
        tone === 'ai' && 'text-violet-300',
        tone === 'brand' && 'text-teal-700',
        tone === 'onDark' && 'text-emerald-300'
      )}
    >
      {children}
    </p>
  );
}

/* ── Act 0: 대시보드 — 원장이 로그인해서 오늘 하루를 확인하는 순간 ── */

function DashboardAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 0);
  const y = useActY(scrollYProgress, 0);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16')}>
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <p className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            로그인하면,
            <br />
            오늘 할 일이
            <br />
            <span className="text-emerald-600">보입니다</span>
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-500 md:text-xl">
            상담 2건, 위험 학생 3명, 미마감 1반 — 원장님이 오늘 무엇부터 해야 하는지 대시보드
            하나로 확인하는 것부터 하루가 시작됩니다.
          </p>
        </div>
        <div className="relative flex h-[320px] items-center justify-center md:h-[420px]">
          <MarketingScreenMockup variant="dashboard" className="w-full max-w-lg" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Act 1: 기록 — 흩어진 신호가 하나로 수렴 ─────────────────────── */

const FRAGMENTS = [
  { id: 'chat', icon: 'ri-chat-3-line', text: '"숙제 못 냈어요"', scatter: { x: -170, y: -125, rotate: -10 }, gather: { x: -78, y: -66, rotate: -3 }, float: 'animate-float' },
  { id: 'memo', icon: 'ri-sticky-note-line', text: '이차방정식 또 틀림', scatter: { x: 165, y: -95, rotate: 8 }, gather: { x: 82, y: -70, rotate: 3 }, float: 'animate-float-slow' },
  { id: 'sheet', icon: 'ri-table-line', text: '점수 92 · 결석 1회', scatter: { x: -160, y: 115, rotate: 6 }, gather: { x: -80, y: 68, rotate: -3 }, float: 'animate-float-slow' },
  { id: 'memory', icon: 'ri-question-line', text: '지난 상담이··· 뭐였더라', scatter: { x: 170, y: 130, rotate: -7 }, gather: { x: 84, y: 72, rotate: 4 }, float: 'animate-float' },
] as const;

function Fragment({ frag, progress }: { frag: (typeof FRAGMENTS)[number]; progress: MotionValue<number> }) {
  const x = useTransform(progress, (p) => lerp(frag.scatter.x, frag.gather.x, p));
  const y = useTransform(progress, (p) => lerp(frag.scatter.y, frag.gather.y, p));
  const rotate = useTransform(progress, (p) => lerp(frag.scatter.rotate, frag.gather.rotate, p));
  return (
    <motion.div style={{ x, y, rotate, willChange: 'transform' }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        className={cn(
          'flex items-center gap-2 whitespace-nowrap rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-md ring-1 ring-slate-200',
          frag.float
        )}
      >
        <i className={frag.icon} />
        {frag.text}
      </div>
    </motion.div>
  );
}

function RecordAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 1);
  const y = useActY(scrollYProgress, 1);
  const local = useLocalProgress(scrollYProgress, 1);
  const fragmentProgress = useTransform(local, (p) => clamp01(p / 0.55));
  const fragmentOpacity = useTransform(local, (p) => clamp01(1 - (p - 0.5) / 0.2));
  const mockupOpacity = useTransform(local, (p) => clamp01((p - 0.6) / 0.25));
  const mockupScale = useTransform(local, (p) => lerp(0.94, 1, (p - 0.6) / 0.25));

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16')}>
        <div>
          <Eyebrow>Today Workspace</Eyebrow>
          <p className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            오늘 수업,
            <br />
            <span className="text-emerald-600">1분</span>이면 됩니다
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-500 md:text-xl">
            출결·숙제·성적·메모 — 흩어져 있던 신호가 하나의 기록으로 모입니다.
          </p>
        </div>
        <div className="relative h-[320px] md:h-[420px]">
          <motion.div style={{ opacity: fragmentOpacity }} className="absolute inset-0 scale-[0.62] sm:scale-75 lg:scale-100">
            {FRAGMENTS.map((f) => (
              <Fragment key={f.id} frag={f} progress={fragmentProgress} />
            ))}
          </motion.div>
          <motion.div
            style={{ opacity: mockupOpacity, scale: mockupScale }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <MarketingScreenMockup variant="today-lesson" className="w-full max-w-lg" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Act 2: AI 브리핑 — 텍스트가 주인공인, 유일하게 어두운 장면 ──── */

function AiAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 2);
  const y = useActY(scrollYProgress, 2);
  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex items-center bg-gradient-to-br from-violet-950 via-indigo-950 to-violet-900"
    >
      <div className={cn(WIDE, 'text-center')}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-200 ring-1 ring-violet-400/30">
          <i className="ri-sparkling-2-line" /> AI 브리핑 · 상담 전 30초 요약
        </span>
        <p className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.15] text-white md:text-6xl lg:text-7xl">
          민준이가 요즘
          <br />
          <span className="text-violet-300">이차방정식에서 자꾸 막혀요</span>
        </p>
        <p className="mt-6 text-xl text-violet-200 md:text-2xl">숙제도 두 번 밀렸어요 — 오늘 상담에서 살짝 물어봐 주세요</p>
      </div>
    </motion.div>
  );
}

/* ── Act 3: 상담 — 기록이 실제로 하나가 되는 화면 ────────────────── */

const TALKING_POINTS = ['이차방정식, 어디서 막히는지 같이 짚어보기', '요즘 숙제가 밀리는 이유 편하게 물어보기', '지난 상담 이후 어떻게 지내는지 확인하기'];

function CounselingAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 3);
  const y = useActY(scrollYProgress, 3);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16')}>
        <MarketingScreenMockup variant="student-hub" className="w-full" />
        <div>
          <Eyebrow>Student CRM</Eyebrow>
          <p className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            기록이 여기서
            <br />
            하나로 만납니다
          </p>
          <ul className="mt-8 space-y-4">
            {TALKING_POINTS.map((p, i) => (
              <li key={p} className="flex items-start gap-3 text-lg text-slate-700">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Act 4: 학생·학부모 포털 — 같은 기록이 두 포털에 동시에 도착한다 ── */

function ParentAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 4);
  const y = useActY(scrollYProgress, 4);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex items-center bg-emerald-50/50">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16')}>
        <div className="flex items-end justify-center gap-4">
          <MarketingScreenMockup variant="student-portal" className="w-[46%] max-w-[220px] origin-bottom-right" />
          <MarketingScreenMockup variant="parent-report" className="w-[54%] max-w-[240px] origin-bottom-left scale-105" />
        </div>
        <div>
          <Eyebrow>학생 · 학부모 포털</Eyebrow>
          <p className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            같은 기록이
            <br />
            두 곳에 닿습니다
          </p>
          <p className="mt-6 max-w-lg border-l-4 border-emerald-300 pl-5 text-xl leading-relaxed text-slate-600 md:text-2xl">
            민준에게는 오늘 숙제와 출석이, 학부모님께는 이번 주 요약과 상담 결과가 — 같은 기록에서
            각자에게 필요한 모습으로 전달됩니다.
          </p>
          <p className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-emerald-600">
            <i className="ri-check-double-line" /> 앱으로 즉시 전달됨
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Progress dots ────────────────────────────────────────────── */

const DOT_LABELS = ['대시보드', '기록', 'AI 브리핑', '상담', '학생·학부모 포털'];

function ProgressDot({ scrollYProgress, index }: { scrollYProgress: MotionValue<number>; index: number }) {
  const opacity = useActOpacity(scrollYProgress, index);
  const dotOpacity = useTransform(opacity, (v) => 0.3 + v * 0.7);
  const scale = useTransform(opacity, (v) => lerp(0.85, 1.15, v));
  return (
    <motion.span
      style={{ opacity: dotOpacity, scale }}
      className="h-1.5 w-1.5 rounded-full bg-slate-400"
      title={DOT_LABELS[index]}
    />
  );
}

/* ── 메인 시퀀스 ──────────────────────────────────────────────── */

export function RecordJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  return (
    <section ref={containerRef} className="relative" style={{ height: `${TOTAL_WEIGHT * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" data-journey-stage>
        <DashboardAct scrollYProgress={scrollYProgress} />
        <RecordAct scrollYProgress={scrollYProgress} />
        <AiAct scrollYProgress={scrollYProgress} />
        <CounselingAct scrollYProgress={scrollYProgress} />
        <ParentAct scrollYProgress={scrollYProgress} />

        <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-2">
          {DOT_LABELS.map((label, i) => (
            <ProgressDot key={label} scrollYProgress={scrollYProgress} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
