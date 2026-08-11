'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MarketingScreenMockup } from '@/components/marketing/ui/MarketingScreenMockup';

/**
 * 원장의 하루 — 스크롤에 묶인 단일 서사.
 * 각 막은 opacity 페이드만이 아니라 local progress로 "장면 안 변화"가 있어야 한다.
 */

const ACT_COUNT = 5;
const GAP = 0.04;
const WIDE = 'mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16';

/** 수렴(1)과 재등록(4)에 스크럽 여유. 전체는 체감 길이 과다하지 않게 유지. */
const ACT_WEIGHTS = [1.35, 2.2, 1.45, 1.45, 1.7] as const;
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
    if (p <= start) return 36;
    if (p >= end) return -36;
    if (p < fadeIn) return lerp(36, 0, (p - start) / (fadeIn - start));
    if (p > fadeOut) return lerp(0, -36, (p - fadeOut) / (end - fadeOut));
    return 0;
  });
}

function useActScale(scrollYProgress: MotionValue<number>, index: number) {
  const [start, end] = bandFor(index);
  const fadeIn = start + GAP;
  const fadeOut = end - GAP;

  return useTransform(scrollYProgress, (p) => {
    if (p <= start) return 0.97;
    if (p >= end) return 0.97;
    if (p < fadeIn) return lerp(0.97, 1, (p - start) / (fadeIn - start));
    if (p > fadeOut) return lerp(1, 0.97, (p - fadeOut) / (end - fadeOut));
    return 1;
  });
}

function useLocalProgress(scrollYProgress: MotionValue<number>, index: number) {
  const [start, end] = bandFor(index);
  return useTransform(scrollYProgress, (p) => clamp01((p - start) / (end - start)));
}

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'ai' }) {
  return (
    <p
      className={cn(
        'text-sm font-bold uppercase tracking-[0.2em]',
        tone === 'ai' && 'text-violet-700',
        tone === 'brand' && 'text-teal-700'
      )}
    >
      {children}
    </p>
  );
}

/** 목업을 올려두는 부드러운 무대 — 와이어프레임처럼 허전하지 않게 */
function MockStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-3xl p-4 md:p-6',
        'bg-[radial-gradient(120%_80%_at_50%_0%,#eef6f2_0%,#f4f5f7_45%,#ebecef_100%)]',
        'ring-1 ring-slate-200/70',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-3 h-8 rounded-[100%] bg-slate-900/10 blur-xl"
      />
      <div className="relative w-full">{children}</div>
    </div>
  );
}

/* ── Act 0: 대시보드 ── */

function DashboardAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 0);
  const y = useActY(scrollYProgress, 0);
  const scale = useActScale(scrollYProgress, 0);
  const local = useLocalProgress(scrollYProgress, 0);
  const mockScale = useTransform(local, (p) => lerp(0.92, 1, Math.min(1, p / 0.45)));
  const mockY = useTransform(local, (p) => lerp(28, 0, Math.min(1, p / 0.45)));
  const line1 = useTransform(local, (p) => clamp01((p - 0.15) / 0.2));
  const line2 = useTransform(local, (p) => clamp01((p - 0.28) / 0.2));
  const line3 = useTransform(local, (p) => clamp01((p - 0.4) / 0.2));

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16')}>
        <div>
          <Eyebrow>01 · 오늘</Eyebrow>
          <p className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            로그인하면
            <br />
            <span className="text-emerald-700">오늘 할 일</span>이
            <br />
            보입니다
          </p>
          <div className="mt-8 space-y-3 border-l border-slate-200 pl-5">
            {[
              { o: line1, t: '상담 2건 · 위험 학생 3명' },
              { o: line2, t: '미마감 수업 1반' },
              { o: line3, t: '재등록 주의 목록이 오른쪽에' },
            ].map((row) => (
              <motion.p key={row.t} style={{ opacity: row.o }} className="text-lg text-slate-600 md:text-xl">
                {row.t}
              </motion.p>
            ))}
          </div>
        </div>
        <motion.div
          style={{ scale: mockScale, y: mockY, willChange: 'transform' }}
          className="relative flex h-[340px] items-center justify-center md:h-[440px]"
        >
          <MockStage className="w-full max-w-xl">
            <MarketingScreenMockup variant="dashboard" className="w-full" />
          </MockStage>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Act 1: 기록 수렴 ── */

const FRAGMENTS = [
  {
    id: 'chat',
    icon: 'ri-chat-3-line',
    text: '"숙제 못 냈어요"',
    scatter: { x: -190, y: -140, rotate: -12 },
    gather: { x: -78, y: -66, rotate: -3 },
  },
  {
    id: 'memo',
    icon: 'ri-sticky-note-line',
    text: '이차방정식 또 틀림',
    scatter: { x: 185, y: -110, rotate: 10 },
    gather: { x: 82, y: -70, rotate: 3 },
  },
  {
    id: 'sheet',
    icon: 'ri-table-line',
    text: '점수 92 · 결석 1회',
    scatter: { x: -180, y: 130, rotate: 8 },
    gather: { x: -80, y: 68, rotate: -3 },
  },
  {
    id: 'memory',
    icon: 'ri-question-line',
    text: '지난 상담이··· 뭐였더라',
    scatter: { x: 190, y: 145, rotate: -9 },
    gather: { x: 84, y: 72, rotate: 4 },
  },
] as const;

function Fragment({
  frag,
  progress,
}: {
  frag: (typeof FRAGMENTS)[number];
  progress: MotionValue<number>;
}) {
  const x = useTransform(progress, (p) => lerp(frag.scatter.x, frag.gather.x, p));
  const y = useTransform(progress, (p) => lerp(frag.scatter.y, frag.gather.y, p));
  const rotate = useTransform(progress, (p) => lerp(frag.scatter.rotate, frag.gather.rotate, p));
  const opacity = useTransform(progress, (p) => lerp(0.55, 1, p));
  return (
    <motion.div
      style={{ x, y, rotate, opacity, willChange: 'transform' }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-md ring-1 ring-slate-200">
        <i className={frag.icon} />
        {frag.text}
      </div>
    </motion.div>
  );
}

function RecordAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 1);
  const y = useActY(scrollYProgress, 1);
  const scale = useActScale(scrollYProgress, 1);
  const local = useLocalProgress(scrollYProgress, 1);
  const fragmentProgress = useTransform(local, (p) => clamp01(p / 0.5));
  const fragmentOpacity = useTransform(local, (p) => clamp01(1 - (p - 0.42) / 0.18));
  const mockupOpacity = useTransform(local, (p) => clamp01((p - 0.52) / 0.22));
  const mockupScale = useTransform(local, (p) => lerp(0.9, 1, (p - 0.52) / 0.22));
  const caption = useTransform(local, (p) => clamp01((p - 0.7) / 0.15));

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16')}>
        <div>
          <Eyebrow>02 · 기록</Eyebrow>
          <p className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            카톡·메모·엑셀이
            <br />
            <span className="text-emerald-700">한 기록</span>으로
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-500 md:text-xl">
            출결·숙제·성적·메모 — 스크롤하면 흩어진 신호가 수업 화면으로 모입니다.
          </p>
          <motion.p style={{ opacity: caption }} className="mt-5 text-sm font-semibold text-emerald-700">
            → Today Workspace에 남습니다
          </motion.p>
        </div>
        <div className="relative h-[340px] md:h-[440px]">
          <motion.div
            style={{ opacity: fragmentOpacity }}
            className="absolute inset-0 scale-[0.62] sm:scale-75 lg:scale-100"
          >
            {FRAGMENTS.map((f) => (
              <Fragment key={f.id} frag={f} progress={fragmentProgress} />
            ))}
          </motion.div>
          <motion.div
            style={{ opacity: mockupOpacity, scale: mockupScale, willChange: 'transform' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <MockStage className="w-full max-w-xl">
              <MarketingScreenMockup variant="today-lesson" className="w-full" />
            </MockStage>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Act 2: AI 브리핑 ── */

const AI_BRIEF_GROUNDS = ['5/18 시험 88 → 76', '숙제 미제출 2회', '지난 상담 5/15'] as const;

function AiAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 2);
  const y = useActY(scrollYProgress, 2);
  const scale = useActScale(scrollYProgress, 2);
  const local = useLocalProgress(scrollYProgress, 2);
  const panelY = useTransform(local, (p) => lerp(40, 0, Math.min(1, p / 0.4)));
  const panelOpacity = useTransform(local, (p) => clamp01(p / 0.35));
  const quote = useTransform(local, (p) => clamp01((p - 0.25) / 0.25));
  const g0 = useTransform(local, (p) => clamp01((p - 0.45) / 0.12));
  const g1 = useTransform(local, (p) => clamp01((p - 0.55) / 0.12));
  const g2 = useTransform(local, (p) => clamp01((p - 0.65) / 0.12));
  const grounds = [g0, g1, g2];

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 flex items-center bg-slate-50">
      <div className={cn(WIDE, 'grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20')}>
        <div>
          <Eyebrow tone="ai">03 · AI 브리핑</Eyebrow>
          <p className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            상담 3분 전,
            <br />
            읽을 문장만
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-500 md:text-xl">
            AI가 화면을 차지하지 않습니다. 기록에서 확인된 사실만 짧게 옆에 둡니다.
          </p>
        </div>
        <motion.div
          style={{ y: panelY, opacity: panelOpacity, willChange: 'transform' }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
            <i className="ri-sparkling-2-line" /> 상담 전 30초 요약
          </p>
          <motion.p
            style={{ opacity: quote }}
            className="mt-5 border-l-2 border-violet-300 pl-5 text-xl font-semibold leading-[1.6] text-slate-800 md:text-2xl"
          >
            민준이가 이차방정식에서 반복해서 막히고 있어요. 숙제도 두 번 밀렸습니다.
          </motion.p>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 pl-5 text-sm text-slate-500">
            <span className="font-semibold text-slate-400">근거</span>
            {AI_BRIEF_GROUNDS.map((g, i) => (
              <motion.span key={g} style={{ opacity: grounds[i] }} className="tabular-nums">
                {g}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Act 3: 상담 ── */

const TALKING_POINTS = [
  '이차방정식, 어디서 막히는지 같이 짚어보기',
  '요즘 숙제가 밀리는 이유 편하게 물어보기',
  '지난 상담 이후 어떻게 지내는지 확인하기',
] as const;

function CounselingAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 3);
  const y = useActY(scrollYProgress, 3);
  const scale = useActScale(scrollYProgress, 3);
  const local = useLocalProgress(scrollYProgress, 3);
  const mockX = useTransform(local, (p) => lerp(-48, 0, Math.min(1, p / 0.4)));
  const mockOpacity = useTransform(local, (p) => clamp01(p / 0.3));
  const p0 = useTransform(local, (p) => clamp01((p - 0.35) / 0.15));
  const p1 = useTransform(local, (p) => clamp01((p - 0.48) / 0.15));
  const p2 = useTransform(local, (p) => clamp01((p - 0.61) / 0.15));
  const x0 = useTransform(p0, (v) => lerp(12, 0, v));
  const x1 = useTransform(p1, (v) => lerp(12, 0, v));
  const x2 = useTransform(p2, (v) => lerp(12, 0, v));
  const pointRows = [
    { text: TALKING_POINTS[0], opacity: p0, x: x0 },
    { text: TALKING_POINTS[1], opacity: p1, x: x1 },
    { text: TALKING_POINTS[2], opacity: p2, x: x2 },
  ] as const;

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 flex items-center bg-white">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16')}>
        <motion.div style={{ x: mockX, opacity: mockOpacity, willChange: 'transform' }}>
          <MockStage>
            <MarketingScreenMockup variant="student-hub" className="w-full" />
          </MockStage>
        </motion.div>
        <div>
          <Eyebrow>04 · 상담</Eyebrow>
          <p className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            기록이 여기서
            <br />
            대화가 됩니다
          </p>
          <ul className="mt-8 space-y-4">
            {pointRows.map((row, i) => (
              <motion.li
                key={row.text}
                style={{ opacity: row.opacity, x: row.x }}
                className="flex items-start gap-3 text-lg text-slate-700"
              >
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                {row.text}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Act 4: 재등록 ── */

function RetentionAct({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useActOpacity(scrollYProgress, 4);
  const y = useActY(scrollYProgress, 4);
  const scale = useActScale(scrollYProgress, 4);
  const local = useLocalProgress(scrollYProgress, 4);
  const leftX = useTransform(local, (p) => lerp(-36, 0, Math.min(1, p / 0.45)));
  const rightX = useTransform(local, (p) => lerp(36, 0, Math.min(1, p / 0.45)));
  const portals = useTransform(local, (p) => clamp01(p / 0.35));
  const line = useTransform(local, (p) => clamp01((p - 0.4) / 0.25));
  const check = useTransform(local, (p) => clamp01((p - 0.65) / 0.2));

  return (
    <motion.div style={{ opacity, y, scale }} className="absolute inset-0 flex items-center bg-emerald-50/40">
      <div className={cn(WIDE, 'grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16')}>
        <motion.div style={{ opacity: portals }} className="flex items-end justify-center">
          <MockStage className="w-full max-w-lg">
            <div className="flex items-end justify-center gap-3 md:gap-4">
              <motion.div style={{ x: leftX, willChange: 'transform' }} className="w-[46%] max-w-[220px]">
                <MarketingScreenMockup variant="student-portal" className="w-full" />
              </motion.div>
              <motion.div
                style={{ x: rightX, willChange: 'transform' }}
                className="w-[54%] max-w-[240px] scale-105"
              >
                <MarketingScreenMockup variant="parent-report" className="w-full" />
              </motion.div>
            </div>
          </MockStage>
        </motion.div>
        <div>
          <Eyebrow>05 · 재등록</Eyebrow>
          <p className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            재등록은
            <br />
            <span className="text-emerald-700">결제일 전</span>에
            <br />
            결정됩니다
          </p>
          <motion.p
            style={{ opacity: line }}
            className="mt-6 max-w-lg border-l-4 border-emerald-400 pl-5 text-xl leading-relaxed text-slate-600 md:text-2xl"
          >
            매주 쌓인 수업·상담 기록이 학부모에게 닿고, 이탈 신호는 결제 고지서보다 먼저 옵니다.
          </motion.p>
          <motion.p
            style={{ opacity: check }}
            className="mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-emerald-700"
          >
            <i className="ri-check-double-line" /> 기록 → 상담 → 재등록
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Progress rail ── */

const DOT_LABELS = ['오늘', '기록', 'AI', '상담', '재등록'] as const;

function ProgressLabel({
  scrollYProgress,
  index,
  label,
}: {
  scrollYProgress: MotionValue<number>;
  index: number;
  label: string;
}) {
  const [start, end] = bandFor(index);
  const active = useTransform(scrollYProgress, (p) =>
    p >= start - 0.01 && p <= end + 0.01 ? 1 : 0.35
  );
  return (
    <motion.span
      style={{ opacity: active }}
      className="text-center text-[11px] font-medium tracking-wide text-slate-600 md:text-xs"
    >
      {label}
    </motion.span>
  );
}

function ProgressRail({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const fill = useTransform(scrollYProgress, (p) => `${clamp01(p) * 100}%`);

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className={cn(WIDE, 'relative py-4')}>
        <div className="relative h-0.5 w-full bg-slate-200">
          <motion.div style={{ width: fill }} className="absolute inset-y-0 left-0 bg-emerald-600" />
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {DOT_LABELS.map((label, i) => (
            <ProgressLabel key={label} scrollYProgress={scrollYProgress} index={i} label={label} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecordJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section
      ref={containerRef}
      className="relative border-t border-slate-100"
      style={{ height: `${TOTAL_WEIGHT * 100}vh` }}
      aria-label="원장의 하루 — 기록에서 재등록까지"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden" data-journey-stage>
        <DashboardAct scrollYProgress={scrollYProgress} />
        <RecordAct scrollYProgress={scrollYProgress} />
        <AiAct scrollYProgress={scrollYProgress} />
        <CounselingAct scrollYProgress={scrollYProgress} />
        <RetentionAct scrollYProgress={scrollYProgress} />
        <ProgressRail scrollYProgress={scrollYProgress} />
      </div>
    </section>
  );
}
