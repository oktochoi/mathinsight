'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FadeUp, SoftParallax } from '@/components/landing/motion';

const TIMELINE = [
  { label: '시험 기록', value: '68점', tone: 'text-indigo-600' },
  { label: '숙제', value: '미완료', tone: 'text-amber-600' },
  { label: '상담 메모', value: '개념 보완', tone: 'text-violet-600' },
];

export function LandingEditorialScene() {
  const [imgOk, setImgOk] = useState(true);

  return (
    <section
      id="scene"
      className="relative py-20 sm:py-28 px-4 sm:px-8 lg:px-12 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <FadeUp className="relative lg:-ml-4 lg:translate-y-2">
          <SoftParallax offset={24} className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-200/30 border border-white/60">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-amber-50/90 to-violet-100/50" />
            {!imgOk && (
              <div className="absolute inset-0 p-10 flex flex-col justify-center gap-2 text-stone-400/50 font-mono text-sm leading-loose pointer-events-none">
                <span>이차함수 · 인수분해</span>
                <span>중간고사 68</span>
                <span>숙제 p.24~26</span>
              </div>
            )}
            {imgOk && (
              <Image
                src="/landing/notebook.png"
                alt="손으로 적은 학생 기록 노트"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={() => setImgOk(false)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/25 via-transparent to-amber-100/20" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/30"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
              aria-hidden
            />
          </SoftParallax>

          <motion.div
            className="absolute -bottom-6 -right-2 sm:right-4 z-10 max-w-[220px] soft-glass rounded-2xl p-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            animate={{ y: [0, -6, 0] }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.5 },
            }}
          >
            <p className="soft-label text-[10px] mb-2">live</p>
            <p className="text-sm font-semibold text-slate-800">기록 연동</p>
            <p className="text-xs soft-body mt-1">4건 · 상담 전</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1} className="relative lg:pl-4 lg:-mt-6">
          <p className="soft-label mb-4">기록 연동</p>
          <h2 className="soft-headline soft-headline-md">
            종이·엑셀 기록을
            <br />
            <span className="soft-accent">디지털 타임라인</span>으로
          </h2>
          <p className="mt-5 soft-body max-w-md">
            상담 전에 시험·숙제·메모를 한 화면에서 확인합니다. 학부모는 같은
            맥락을 24시간 AI에게 문의할 수 있습니다.
          </p>

          <motion.div
            className="mt-10 soft-glass rounded-[1.5rem] overflow-hidden max-w-md"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          >
            <div className="px-5 py-3 border-b border-white/50 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400/90">eduflow</span>
              <motion.span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-100"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                4건 연결됨
              </motion.span>
            </div>
            <div className="px-5 py-4">
              <p className="soft-label text-[10px] mb-3">상담 전 타임라인</p>
              <ul className="space-y-3">
                {TIMELINE.map((row) => (
                  <li
                    key={row.label}
                    className="flex justify-between items-center text-sm py-2 border-b border-slate-100/80 last:border-0"
                  >
                    <span className="text-slate-600/90">{row.label}</span>
                    <span className={`font-semibold ${row.tone}`}>{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
