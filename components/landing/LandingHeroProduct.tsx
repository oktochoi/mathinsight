'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandFlowLineVertical } from '@/components/landing/BrandFlowLine';
import { FloatY } from '@/components/landing/motion';

const TABS = ['흐름', '기록', '상담'] as const;

const TIMELINE = [
  {
    id: 'exam',
    icon: 'ri-file-list-3-line',
    label: '시험 기록',
    time: '5/16 · 18:20',
    text: '중간고사 68점',
    sub: '이차함수',
    dot: 'bg-[#4a6fa5]',
  },
  {
    id: 'hw',
    icon: 'ri-book-2-line',
    label: '숙제',
    time: '5/14',
    text: '2회차 미완료',
    sub: 'p.24~26',
    dot: 'bg-amber-500',
  },
  {
    id: 'memo',
    icon: 'ri-chat-3-line',
    label: '상담 메모',
    time: '5/12',
    text: '개념 보완',
    sub: '유형 풀이',
    dot: 'bg-slate-400',
  },
  {
    id: 'next',
    icon: 'ri-flag-line',
    label: '다음 상담',
    time: '5/22',
    text: '유형별 풀이 점검',
    sub: '포인트',
    dot: 'bg-[#2563eb]',
    highlight: true,
  },
];

export function LandingHeroProduct() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('흐름');
  const [activeId, setActiveId] = useState('next');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const ids = TIMELINE.map((t) => t.id);
    const t = setInterval(() => {
      setActiveId((prev) => ids[(ids.indexOf(prev) + 1) % ids.length]);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const focusId = hovered ?? activeId;

  return (
    <div className="relative w-full h-full min-h-[420px]">
      {/* L1 */}
      <div className="landing-l1 absolute -inset-4 sm:-inset-8 rounded-[2.5rem] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 55% 45%, rgba(37,99,235,0.22) 0%, rgba(74,111,165,0.08) 50%, transparent 72%)',
          }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* L3 — small accents */}
      <FloatY range={6} duration={5} className="landing-l3-interactive absolute top-[8%] right-[4%] z-30 max-w-[150px] hidden sm:block">
        <div
          className="rounded-lg px-3 py-2.5 shadow-lg border border-amber-200/70 text-[10px]"
          style={{ background: 'linear-gradient(165deg,#fffbeb,#fef3c7)', transform: 'rotate(3deg)' }}
        >
          <p className="font-bold text-amber-900/80">다음 상담</p>
          <p className="text-amber-950/90 font-medium mt-0.5">유형별 풀이</p>
        </div>
      </FloatY>

      <motion.div
        className="landing-l3-interactive absolute top-[18%] left-0 sm:left-[2%] z-30 max-w-[160px] landing-glass-strong rounded-xl p-3 shadow-xl hidden md:block"
        style={{ rotate: -4 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity }}
      >
        <p className="text-[10px] font-bold text-[#2563eb]">최근 노트</p>
        <p className="text-[11px] text-slate-600 mt-1">5/12 상담 완료</p>
      </motion.div>

      {/* L2 — main shell */}
      <motion.div
        className="landing-l2 relative h-full w-full landing-hero-product-shell rounded-2xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200/60 bg-slate-50/95 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-auto text-[11px] text-slate-400 font-mono">mathinsight · live</span>
        </div>

        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 text-white text-base font-bold flex items-center justify-center shadow-inner">
            김
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-slate-900 tracking-tight">김안준</p>
            <p className="text-xs text-slate-500 mt-0.5">고2 · A반</p>
          </div>
          <p className="text-[11px] font-mono text-slate-500 tabular-nums">오늘 21:04</p>
        </div>

        <div className="px-5 py-2.5 flex gap-1.5 bg-white border-b border-slate-50 shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 text-xs font-semibold rounded-lg ${
                tab === t ? 'text-[#2563eb]' : 'text-slate-400'
              }`}
            >
              {tab === t && (
                <motion.span
                  layoutId="hero-tab-pill"
                  className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 px-6 py-6 bg-gradient-to-b from-white to-slate-50/80 min-h-[200px]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em]">
              상담 전 흐름
            </p>
            <motion.span
              className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-[#2563eb] font-bold border border-blue-200/60"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              4건 연결
            </motion.span>
          </div>

          <div className="flex gap-4 h-full">
            <div className="relative w-3 shrink-0">
              <BrandFlowLineVertical className="absolute inset-0 w-full h-full min-h-[220px]" animate />
            </div>
            <ul className="flex-1 space-y-0.5">
              <AnimatePresence mode="popLayout">
                {TIMELINE.map((row, i) => {
                  const on = focusId === row.id;
                  return (
                    <motion.li
                      key={row.id}
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      onMouseEnter={() => setHovered(row.id)}
                      onMouseLeave={() => setHovered(null)}
                      className={`flex gap-3 rounded-xl p-3 -mx-1 transition-all duration-300 ${
                        on
                          ? 'bg-white shadow-[0_12px_40px_-10px_rgba(37,99,235,0.28)] ring-1 ring-blue-200/80'
                          : 'opacity-55 hover:opacity-80'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${row.dot} ring-4 ring-white`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{row.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{row.time}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mt-1">{row.text}</p>
                        {row.sub && <p className="text-[11px] text-slate-400">{row.sub}</p>}
                      </div>
                      <i className={`${row.icon} text-slate-400 text-lg shrink-0`}></i>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
