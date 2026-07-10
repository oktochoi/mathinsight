'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  FAQ_ITEMS,
  MARKETING_ROUTES,
  PRICING_PLANS,
} from '@/lib/marketing/siteStructure';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FAQSection } from '@/components/marketing/ui/FAQSection';
import { Button } from '@/components/marketing/ui/Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { mkt } from '@/lib/marketing/ui';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

const VALUE_PROPS = [
  { icon: 'ri-time-line', title: '상담 준비 시간 ↓', desc: '수업 기록이 즉시 AI 브리핑으로 변환됩니다.' },
  { icon: 'ri-user-heart-line', title: '학생 이해도 ↑', desc: '학생 타임라인으로 맥락을 놓치지 않습니다.' },
  { icon: 'ri-loop-right-line', title: '재등록 효율 ↑', desc: '상담 기록과 재등록 판단이 하나로 연결됩니다.' },
];

const COMPARE = [
  { feature: '학생 수',          starter: '50명',      growth: '150명',    pro: '무제한' },
  { feature: '수업·출결·숙제 기록', starter: '✓',        growth: '✓',        pro: '✓' },
  { feature: 'AI 상담 브리핑',    starter: '✓',        growth: '✓',        pro: '✓' },
  { feature: '학부모 리포트',     starter: '기본',      growth: '고급',      pro: '고급' },
  { feature: '학부모 포털·채팅',  starter: '—',        growth: '✓',        pro: '✓' },
  { feature: '재등록 관리',       starter: '—',        growth: '✓',        pro: '✓' },
  { feature: '강사 Dashboard',   starter: '—',        growth: '✓',        pro: '✓' },
  { feature: '다학원 관리',       starter: '—',        growth: '—',        pro: '✓' },
  { feature: 'API 연동',         starter: '—',        growth: '—',        pro: '✓' },
  { feature: '전담 CS',          starter: '이메일',    growth: '우선 지원', pro: '전담' },
];

export function PricingPageContent() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/60 py-14 md:py-20">
        <div className={cn(mkt.container, 'text-center')}>
          <FadeIn>
            <p className={cn(mkt.eyebrow, 'mb-3')}>Pricing</p>
            <h1 className={mkt.h1}>
              {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.title : '학원 규모에 맞는 플랜 선택'}
            </h1>
            <p className={cn(mkt.lead, 'mt-4 mx-auto max-w-xl')}>
              {PROMO_ALL_FREE.active
                ? PROMO_ALL_FREE.subtitle
                : '모든 플랜에 3일 무료 체험이 포함됩니다. 카드 등록 없이 바로 시작하세요.'}
            </p>

            {PROMO_ALL_FREE.active ? (
              <span className="mt-5 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">
                {PROMO_ALL_FREE.badge}
              </span>
            ) : (
            <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold transition-all',
                  !annual ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all',
                  annual ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                연간
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
                  annual ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                )}>
                  20% 할인
                </span>
              </button>
            </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ── PLAN CARDS ───────────────────────────────── */}
      <Section>
        <SectionInner>
          <Reveal className="grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              const monthlyPrice = plan.price;
              const annualPrice = Math.round(monthlyPrice * 0.8 / 100) * 100;
              const displayPrice = PROMO_ALL_FREE.active
                ? PROMO_ALL_FREE.priceLabel
                : annual
                  ? annualPrice
                  : monthlyPrice;
              const displayLabel =
                typeof displayPrice === 'string'
                  ? displayPrice
                  : displayPrice.toLocaleString('ko-KR');

              return (
                <RevealItem key={plan.name}>
                  <article
                    className={cn(
                      'relative flex h-full flex-col rounded-2xl border bg-white p-7 transition-shadow hover:shadow-lg',
                      plan.featured
                        ? 'border-emerald-400 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/50'
                        : 'border-slate-200 shadow-sm'
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1 text-[11px] font-bold text-white shadow-md shadow-green-600/30">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">학생 {plan.students}</p>
                      <p className={cn(mkt.muted, 'mt-2')}>{plan.desc}</p>
                    </div>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1">
                        {!PROMO_ALL_FREE.active && (
                          <span className="text-sm text-slate-400">₩</span>
                        )}
                        <span
                          className={cn(
                            'text-4xl font-extrabold tracking-tight',
                            PROMO_ALL_FREE.active ? 'text-green-600' : 'text-slate-900'
                          )}
                        >
                          {displayLabel}
                        </span>
                        {!PROMO_ALL_FREE.active && (
                          <span className="text-sm text-slate-400">/월</span>
                        )}
                        {PROMO_ALL_FREE.active && (
                          <span className="text-sm text-slate-500">(행사 기간)</span>
                        )}
                      </div>
                      {!PROMO_ALL_FREE.active && annual && (
                        <p className="mt-1 text-xs text-slate-400 line-through">
                          ₩{plan.priceLabel}/월
                        </p>
                      )}
                      {annual && !PROMO_ALL_FREE.active && (
                        <p className="mt-0.5 text-xs font-semibold text-green-600">
                          연간 ₩{(annualPrice * 12).toLocaleString('ko-KR')} 결제
                        </p>
                      )}
                    </div>

                    <ul className="mb-8 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                          <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                            <i className="ri-check-line" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      href={MARKETING_ROUTES.signup}
                      variant={plan.featured ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '3일 무료 체험 시작'}
                    </Button>
                  </article>
                </RevealItem>
              );
            })}
          </Reveal>

          <FadeIn>
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
              <p className="text-sm text-slate-600">
                <i className="ri-information-line mr-1.5 text-slate-400" />
                {PROMO_ALL_FREE.active
                  ? `${PROMO_ALL_FREE.footnote} 행사 기간 중 모든 플랜 요금은 0원입니다.`
                  : '모든 플랜은 3일 무료 체험으로 시작합니다. 체험 기간 중 카드 청구 없음. 기간 후 원하는 플랜으로 전환하거나 자유롭게 취소하세요.'}
              </p>
            </div>
          </FadeIn>
        </SectionInner>
      </Section>

      {/* ── VALUE PROPS ──────────────────────────────── */}
      <Section muted>
        <SectionInner>
          <SectionHeader eyebrow="Value" title="왜 EduFlow를 선택하나요?" align="center" />
          <Reveal className="mt-8 grid gap-4 md:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <RevealItem key={v.title}>
                <div className={cn(mkt.card, 'p-6 text-center')}>
                  <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-xl mb-4">
                    <i className={v.icon} />
                  </span>
                  <h3 className={cn(mkt.h3, 'text-teal-700')}>{v.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{v.desc}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      {/* ── FEATURE COMPARISON ───────────────────────── */}
      <Section>
        <SectionInner>
          <SectionHeader eyebrow="Compare" title="플랜별 기능 비교" align="center" />
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-4 text-left font-semibold text-slate-600">기능</th>
                  {PRICING_PLANS.map((p) => (
                    <th key={p.name} className={cn(
                      'px-4 py-4 text-center font-bold',
                      p.featured ? 'text-teal-700' : 'text-slate-700'
                    )}>
                      {p.name}
                      {p.featured && (
                        <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">추천</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.feature} className={cn('border-b border-slate-50', i % 2 === 1 && 'bg-slate-50/50')}>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{row.feature}</td>
                    {[row.starter, row.growth, row.pro].map((val, j) => (
                      <td key={j} className={cn(
                        'px-4 py-3.5 text-center',
                        val === '✓' ? 'text-green-600 font-bold' : val === '—' ? 'text-slate-300' : 'text-slate-600'
                      )}>
                        {val === '✓' ? <i className="ri-check-line text-base" /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionInner>
      </Section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <Section muted>
        <SectionInner>
          <SectionHeader eyebrow="FAQ" title="자주 묻는 질문" align="center" />
          <div className="mt-8">
            <FAQSection items={FAQ_ITEMS.slice(0, 6)} defaultOpen={0} />
          </div>
        </SectionInner>
      </Section>

      <CTASection
        variant="green"
        title={PROMO_ALL_FREE.active ? `${PROMO_ALL_FREE.badge} — 모든 플랜 무료` : '3일 무료 체험으로 시작하세요'}
        description={
          PROMO_ALL_FREE.active
            ? PROMO_ALL_FREE.footnote
            : '카드 등록 없이 시작 · Demo로 먼저 확인 가능'
        }
        primary={{
          href: MARKETING_ROUTES.signup,
          label: PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '무료 체험',
          variant: 'accent',
        }}
        secondary={{ href: MARKETING_ROUTES.contact, label: '도입 문의' }}
      />
    </>
  );
}
