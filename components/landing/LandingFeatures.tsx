'use client';

import { motion } from 'framer-motion';
import { FadeUp } from '@/components/landing/motion';

const FEATURES = [
  {
    icon: 'ri-user-settings-line',
    title: '어드민',
    desc: '학생·반·기록이 한곳에 모여요.',
    sub: '권한도 부드럽게',
    tone: 'soft-card-tone-lavender',
    iconGrad: 'from-violet-100 to-indigo-50',
    offset: 'lg:translate-y-3',
    rotate: '-rotate-1',
  },
  {
    icon: 'ri-group-line',
    title: '학생관리',
    desc: '시험과 숙제가 타임라인으로 이어져요.',
    sub: '흐름이 남아요',
    tone: 'soft-card-tone-sky',
    iconGrad: 'from-sky-100 to-blue-50',
    offset: 'lg:-translate-y-2',
    rotate: 'rotate-0.5',
  },
  {
    icon: 'ri-chat-smile-3-line',
    title: '상담',
    desc: '상담 전, 다시 펼쳐볼 수 있어요.',
    sub: '준비가 가벼워져요',
    tone: 'soft-card-tone-cream',
    iconGrad: 'from-amber-50 to-yellow-50',
    offset: 'lg:translate-y-5',
    rotate: 'rotate-1',
  },
  {
    icon: 'ri-mail-send-line',
    title: '학부모 메시지',
    desc: '리포트 초안이 살짝 떠오르게.',
    sub: '초안부터 함께',
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
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
          <p className="soft-label mb-4">이어지는 것들</p>
          <h2 className="soft-headline soft-headline-md">
            기록이 <span className="soft-accent">이어집니다</span>
          </h2>
          <p className="mt-4 soft-body text-sm sm:text-base">
            흩어진 메모 대신, 한 줄기의 흐름으로 남아요.
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
