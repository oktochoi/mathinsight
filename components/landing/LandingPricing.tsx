'use client';

import Link from 'next/link';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

const PLANS = [
  {
    name: 'Starter',
    price: '49,000',
    period: '월',
    desc: '소형 학원 · 상담 준비 자동화 시작',
    features: [
      '학생 50명까지',
      'AI 학생 요약 · 상담 카드',
      '오늘 상담 큐',
      '학부모 리포트 (기본)',
    ],
    cta: '무료로 시작',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '129,000',
    period: '월',
    desc: '상담·재등록 운영을 본격적으로',
    features: [
      '학생 200명까지',
      '위험 학생 감지 · Risk Snapshot',
      'AI 상담 카드 · Workflow 전체',
      '학부모 포털 AI · 재등록 관리',
      '우선 지원',
    ],
    cta: '무료로 시작',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '문의',
    period: '',
    desc: '다지점 · 맞춤 AI · 전담 온보딩',
    features: [
      '무제한 학생 · 다학원',
      '맞춤 Workflow · API 연동',
      '전담 CS · 온사이트 교육',
      'SLA · 보안 감사 지원',
    ],
    cta: '도입 문의',
    href: '#contact',
    featured: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="ef-section ef-section-muted scroll-mt-20">
      <div className="ef-container">
        <div className="ef-section-head ef-section-head-center">
          <p className="ef-eyebrow">Pricing</p>
          <h2 className="ef-section-title">
            {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.title : '학원 규모에 맞는 요금'}
          </h2>
          <p className="ef-section-desc">
            {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.subtitle : '14일 무료 체험 · 카드 등록 없이 시작'}
          </p>
          {PROMO_ALL_FREE.active && (
            <span className="inline-block mt-3 rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800">
              {PROMO_ALL_FREE.badge}
            </span>
          )}
        </div>

        <div className="ef-pricing-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`ef-card ef-pricing-card ${plan.featured ? 'ef-pricing-featured' : ''}`}
            >
              {plan.featured && <span className="ef-pricing-badge">추천</span>}
              <h3 className="ef-pricing-name">{plan.name}</h3>
              <p className="ef-pricing-desc">{plan.desc}</p>
              <div className="ef-pricing-price">
                {PROMO_ALL_FREE.active ? (
                  <>
                    <span className="ef-pricing-amount text-green-600">{PROMO_ALL_FREE.priceLabel}</span>
                    <span className="ef-pricing-period text-stone-400 text-sm ml-1">(행사 기간)</span>
                  </>
                ) : (
                  <>
                    {plan.price !== '문의' && <span className="ef-pricing-currency">₩</span>}
                    <span className="ef-pricing-amount">{plan.price}</span>
                    {plan.period && <span className="ef-pricing-period">/{plan.period}</span>}
                  </>
                )}
              </div>
              <ul className="ef-pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <i className="ri-check-line" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={plan.featured ? 'ef-btn-primary w-full text-center' : 'ef-btn-secondary w-full text-center'}
              >
                {PROMO_ALL_FREE.active && plan.cta !== '도입 문의' ? PROMO_ALL_FREE.cta : plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
