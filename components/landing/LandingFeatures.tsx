'use client';

import { motion } from 'framer-motion';
import { FadeUp } from '@/components/landing/motion';

const FEATURES = [
  {
    icon: 'ri-user-settings-line',
    title: '어드민',
    desc: '학생·반·권한·기록을 한 화면에서 관리합니다.',
    sub: '학원 운영',
    tone: 'soft-card-tone-lavender',
    iconGrad: 'from-violet-100 to-indigo-50',
    offset: 'lg:translate-y-3',
    rotate: '-rotate-1',
  },
  {
    icon: 'ri-group-line',
    title: '학생관리',
    desc: '시험·숙제·진도를 타임라인으로 조회합니다.',
    sub: '기록 통합',
    tone: 'soft-card-tone-sky',
    iconGrad: 'from-sky-100 to-blue-50',
    offset: 'lg:-translate-y-2',
    rotate: 'rotate-0.5',
  },
  {
    icon: 'ri-chat-smile-3-line',
    title: '상담',
    desc: '상담 카드와 완료 상태로 상담 이력을 관리합니다.',
    sub: '상담 워크플로',
    tone: 'soft-card-tone-cream',
    iconGrad: 'from-amber-50 to-yellow-50',
    offset: 'lg:translate-y-5',
    rotate: 'rotate-1',
  },
  {
    icon: 'ri-robot-2-line',
    title: '학부모 AI',
    desc: '24시간 자녀의 학습·진도·상담 맥락을 질문하고 답변받습니다.',
    sub: '24시간 문의',
    tone: 'soft-card-tone-blush',
    iconGrad: 'from-rose-50 to-pink-50',
    offset: 'lg:-translate-y-1',
    rotate: '-rotate-0.5',
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="relative py-20 sm:py-28 px-4 sm:px-8 lg:px-12 scroll-mt-20"
    >
      <div className="soft-section-divider max-w-6xl mx-auto mb-16 sm:mb-20" aria-hidden />
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
          <p className="soft-label mb-4">핵심 기능</p>
          <h2 className="soft-headline soft-headline-md">
            운영과 <span className="soft-accent">학부모 소통</span>
          </h2>
          <p className="mt-4 soft-body text-sm sm:text-base">
            기록·상담·학부모 AI 문의를 같은 데이터 기준으로 제공합니다.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.07} className={f.offset}>
              <motion.div
                className={`soft-card ${f.tone} p-7 sm:p-8 h-full ${f.rotate}`}
                whileHover={{ y: -8, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.iconGrad} flex items-center justify-center mb-5 shadow-sm border border-white/90`}
                >
                  <i className={`${f.icon} text-xl text-indigo-500`}></i>
                </div>
                <span className="soft-label text-[10px] block mb-2 opacity-70">{f.sub}</span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm soft-body leading-relaxed">{f.desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
