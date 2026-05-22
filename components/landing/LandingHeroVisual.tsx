'use client';

import { motion } from 'framer-motion';
import { HoverLift } from '@/components/landing/motion';

const TIMELINE = [
  {
    icon: 'ri-file-list-3-line',
    label: '시험 기록',
    date: '5/16',
    text: '중간고사 68점',
    sub: '이차함수 보완',
    chip: '68점',
    chipTone: 'bg-indigo-50 text-indigo-700 border-indigo-100/80',
    iconBg: 'from-indigo-50 to-violet-50',
  },
  {
    icon: 'ri-book-2-line',
    label: '숙제 기록',
    date: '5/14',
    text: '2회차 미완료',
    sub: 'p.24~26',
    chip: '미완료',
    chipTone: 'bg-amber-50 text-amber-800 border-amber-100/80',
    iconBg: 'from-amber-50 to-orange-50',
  },
  {
    icon: 'ri-chat-3-line',
    label: '상담 메모',
    date: '5/12',
    text: '개념 이해 보완',
    sub: '다음 상담 때 확인',
    chip: '완료',
    chipTone: 'bg-slate-50 text-slate-600 border-slate-200/80',
    iconBg: 'from-slate-50 to-zinc-50',
  },
  {
    icon: 'ri-stack-line',
    label: '단원 진도',
    date: '5/08',
    text: '이차함수 → 인수분해',
    sub: '',
    chip: null,
    chipTone: '',
    iconBg: 'from-sky-50 to-blue-50',
  },
];

export function LandingHeroVisual() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto lg:ml-auto min-h-[440px] sm:min-h-[480px]">
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-[95%] h-[82%] rounded-[3rem] blur-[80px] pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(ellipse, rgba(129,140,248,0.28) 0%, rgba(186,230,253,0.2) 40%, rgba(254,243,199,0.15) 70%, transparent 85%)',
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <HoverLift className="relative z-10 mt-2">
        <div className="landing-product-shell rounded-[1.75rem] p-0 overflow-hidden bg-white/95 backdrop-blur-sm">
          <div className="px-6 pt-6 pb-5 border-b border-indigo-50/80 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-indigo-200/60 shrink-0">
              김
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-slate-900 tracking-tight">김연준</p>
              <p className="text-xs text-slate-500/90 mt-0.5 leading-relaxed">고2 · A반</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100/80">
              live
            </span>
          </div>

          <div className="px-5 py-3 flex gap-2 border-b border-slate-50/80">
            {['흐름', '기록', '상담'].map((t, i) => (
              <span
                key={t}
                className={`px-4 py-2 text-[11px] font-semibold rounded-xl transition-colors ${
                  i === 0
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/60'
                    : 'text-slate-400'
                }`}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="px-6 py-5">
            <p className="soft-label text-indigo-400/90 mb-4">학생 흐름</p>
            <ul className="space-y-2">
              {TIMELINE.map((row, i) => (
                <motion.li
                  key={row.date + row.label}
                  className="flex gap-3.5 rounded-2xl p-3 -mx-1 hover:bg-white/80 transition-colors"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  whileHover={{ x: 4 }}
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${row.iconBg} border border-white/90 flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <i className={`${row.icon} text-indigo-500/90 text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">{row.label}</span>
                      <span className="text-[10px] text-slate-400/90 tabular-nums">{row.date}</span>
                    </div>
                    <p className="text-[13px] text-slate-700 mt-1 leading-relaxed">{row.text}</p>
                    {row.sub && (
                      <p className="text-[11px] text-slate-400/90 mt-0.5">{row.sub}</p>
                    )}
                  </div>
                  {row.chip && (
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold h-fit shrink-0 ${row.chipTone}`}
                    >
                      {row.chip}
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </HoverLift>

      <motion.div
        className="absolute top-[20%] -right-2 sm:right-2 z-20 w-[128px] rounded-2xl px-3.5 py-3 shadow-lg soft-sticky-wiggle"
        style={{
          background: 'linear-gradient(165deg, #fffbeb 0%, #fef9c3 100%)',
          border: '1px solid #fde68a',
        }}
      >
        <p className="text-[11px] font-bold text-amber-900/90">개념 보완</p>
        <p className="text-[10px] text-amber-800/65 mt-1 leading-relaxed">5/12 상담</p>
      </motion.div>

      <motion.div
        className="absolute -bottom-1 left-6 sm:left-10 z-30 w-[min(100%,250px)] rounded-2xl px-4 py-4 shadow-xl soft-sticky-wiggle"
        style={{
          background: 'linear-gradient(165deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          animationDelay: '1.2s',
        }}
      >
        <p className="text-[11px] text-amber-900/85 font-medium leading-relaxed">
          다음 상담 — 유형별 풀이 점검
        </p>
        <p className="text-[10px] text-amber-800/50 mt-2 tabular-nums">메모 · 5/16</p>
      </motion.div>

      <motion.span
        className="absolute top-[8%] left-0 z-20 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-white/90 text-violet-600 border border-violet-100 shadow-sm backdrop-blur-sm"
        animate={{ y: [0, -5, 0], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        4건 연결됨
      </motion.span>
    </div>
  );
}
