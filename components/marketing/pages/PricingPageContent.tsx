'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  FAQ_ITEMS,
  MARKETING_ROUTES,
  PRICING_PLANS,
} from '@/lib/marketing/siteStructure';
import { Section } from '@/components/marketing/ui/Section';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { mkt } from '@/lib/marketing/ui';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

/** 가격·비교는 랜딩보다 서류처럼 읽혀야 하므로 히어로보다 좁은 문서 폭을 쓴다 */
const DOC = 'mx-auto w-full max-w-[1120px] px-6 md:px-12 lg:px-16';

/** 플랜 차이가 아니라 "요금으로 무엇이 달라지는가" — 모든 플랜에서 참인 것만 적는다 */
const VALUE_ROWS = [
  {
    label: '상담 준비 시간',
    desc: '출결·숙제·성적 기록이 상담 브리핑으로 정리됩니다. 상담 전에 자료를 다시 모으지 않습니다.',
  },
  {
    label: '학생 한 명의 맥락',
    desc: '수업·상담·학부모 소통이 학생 아래 하나의 타임라인으로 남아, 지난 상담 이후 변화가 보입니다.',
  },
  {
    label: '학부모 소통 근거',
    desc: '상담과 수업 기록이 그대로 학부모 리포트 초안이 되어, 같은 내용을 다시 옮겨 적지 않습니다.',
  },
] as const;

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

/** 결정 전에 확인하는 조건 — 카드가 아니라 계약 조항처럼 한 줄씩 */
const TERMS = [
  {
    label: '시작 방식',
    desc: PROMO_ALL_FREE.active
      ? '카드 등록 없이 가입한 뒤 바로 사용합니다. 행사 기간 중에는 요금이 청구되지 않습니다.'
      : '카드 등록 없이 3일 무료 체험으로 시작합니다. 체험 기간 중 청구는 없습니다.',
  },
  {
    label: '플랜 변경 · 해지',
    desc: '학생 수가 늘면 상위 플랜으로 전환할 수 있고, 해지도 원하는 시점에 하실 수 있습니다.',
  },
  {
    label: '데이터 취급',
    desc: '학원별로 데이터가 분리되고, AI는 해당 학원이 기록한 내용만 참조합니다.',
    href: MARKETING_ROUTES.security,
    hrefLabel: '보안 원칙 보기',
  },
  {
    label: '도입 지원',
    desc: '기존 엑셀·수기 기록은 단계적으로 옮깁니다. 학원 운영 방식에 맞춰 온보딩을 안내드립니다.',
    href: MARKETING_ROUTES.contact,
    hrefLabel: '도입 문의',
  },
] as const;

export function PricingPageContent() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* ── HERO — 가격표 앞의 조용한 표지 ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fcfdfd_62%,#f5f9f7_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(115%_80%_at_50%_0%,black,transparent_72%)]"
        />

        <div className={cn(DOC, 'relative pb-16 pt-[6vh] md:pb-20 md:pt-[8vh]')}>
          <FadeIn y={12}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={mkt.eyebrow}>Pricing</span>
              <span className="hidden h-4 w-px bg-slate-300 sm:block" />
              <span className="text-sm text-slate-500">학생 수 기준 세 가지 플랜</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.06} y={14}>
            <h1 className="mkt-display mt-8 max-w-[24ch] text-[clamp(2rem,4.4vw,3.25rem)] text-slate-900 md:mt-10">
              {PROMO_ALL_FREE.active ? (
                <>
                  지금은 모든 플랜이 <span className="text-emerald-700">무료</span>입니다
                </>
              ) : (
                <>
                  학원 규모에 맞는
                  <br />
                  플랜 하나만 고르시면 됩니다
                </>
              )}
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.75] tracking-[-0.012em] text-slate-600">
              {PROMO_ALL_FREE.active
                ? PROMO_ALL_FREE.subtitle
                : '모든 플랜에 3일 무료 체험이 포함됩니다. 카드 등록 없이 바로 시작하실 수 있습니다.'}
            </p>
          </FadeIn>

          <FadeIn delay={0.18}>
            {PROMO_ALL_FREE.active ? (
              <p className="mt-8 border-l-2 border-emerald-600 pl-4 text-sm leading-relaxed">
                <span className="font-bold text-emerald-700">{PROMO_ALL_FREE.badge}</span>
                <span className="ml-2 text-slate-500">{PROMO_ALL_FREE.footnote}</span>
              </p>
            ) : (
              <>
                <div className="mt-8 inline-flex items-center border border-slate-300 text-sm">
                  <button
                    type="button"
                    onClick={() => setAnnual(false)}
                    aria-pressed={!annual}
                    className={cn(
                      'px-5 py-2.5 font-semibold transition-colors duration-200',
                      !annual ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    월간
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnual(true)}
                    aria-pressed={annual}
                    className={cn(
                      'border-l border-slate-300 px-5 py-2.5 font-semibold transition-colors duration-200',
                      annual ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    연간
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-500">연간 결제 시 20% 할인</p>
              </>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ── 플랜 — 카드 스택이 아니라 3열 정밀 그리드 ── */}
      <Section className="border-t border-slate-100 py-16 md:py-24">
        <div className={DOC}>
          <Reveal
            className="grid border-y border-slate-200 md:grid-cols-3 md:divide-x md:divide-slate-100"
            stagger={0.06}
          >
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
                <RevealItem
                  key={plan.name}
                  className={cn(
                    'relative border-b border-slate-100 last:border-b-0 md:border-b-0',
                    plan.featured && 'bg-slate-50/70'
                  )}
                >
                  {plan.featured && (
                    <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-emerald-600" />
                  )}

                  <div className="flex h-full flex-col px-1 py-8 md:px-7">
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                        {plan.name}
                      </h2>
                      {plan.badge && (
                        <span className="text-[11px] font-bold text-emerald-700">{plan.badge}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-500">학생 {plan.students}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{plan.desc}</p>

                    <div className="mt-7">
                      <p className="flex items-baseline gap-1">
                        {!PROMO_ALL_FREE.active && (
                          <span className="text-base text-slate-400">₩</span>
                        )}
                        <span
                          className={cn(
                            'text-[2.25rem] font-extrabold tabular-nums leading-none tracking-[-0.02em]',
                            PROMO_ALL_FREE.active ? 'text-emerald-700' : 'text-slate-900'
                          )}
                        >
                          {displayLabel}
                        </span>
                        {!PROMO_ALL_FREE.active && (
                          <span className="text-sm text-slate-400">/월</span>
                        )}
                        {PROMO_ALL_FREE.active && (
                          <span className="text-sm text-slate-500">행사 기간</span>
                        )}
                      </p>
                      {!PROMO_ALL_FREE.active && annual && (
                        <p className="mt-2 text-xs text-slate-400">
                          <span className="tabular-nums line-through">₩{plan.priceLabel}/월</span>
                          <span className="ml-2 font-semibold tabular-nums text-emerald-700">
                            연간 ₩{(annualPrice * 12).toLocaleString('ko-KR')} 결제
                          </span>
                        </p>
                      )}
                    </div>

                    <ul className="mt-7 flex-1 space-y-2.5 border-t border-slate-100 pt-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                          <i
                            aria-hidden
                            className="ri-check-line mt-0.5 flex-none text-[13px] text-emerald-600"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={MARKETING_ROUTES.signup}
                      className={cn(
                        plan.featured ? mkt.btnGreen : mkt.btnOutline,
                        'group mt-8 w-full py-3 text-sm'
                      )}
                    >
                      {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '3일 무료 체험 시작'}
                      {plan.featured && (
                        <i
                          aria-hidden
                          className="ri-arrow-right-line ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      )}
                    </Link>
                  </div>
                </RevealItem>
              );
            })}
          </Reveal>

          <FadeIn delay={0.08}>
            <p className="mt-6 text-sm leading-relaxed text-slate-500">
              {PROMO_ALL_FREE.active
                ? `${PROMO_ALL_FREE.footnote} · 행사 기간 중 모든 플랜 요금은 0원입니다.`
                : '체험 기간 중 카드 청구는 없습니다. 기간이 끝나면 원하는 플랜으로 전환하거나 그대로 종료하실 수 있습니다.'}
            </p>
          </FadeIn>
        </div>
      </Section>

      {/* ── 요금으로 달라지는 것 — 아이콘 카드가 아니라 문장 행 ── */}
      <Section muted className="border-t border-slate-100 py-16 md:py-24">
        <div className={DOC}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Value</p>
            <h2 className="mkt-display text-[clamp(1.5rem,3vw,1.875rem)] text-slate-900 md:text-3xl">
              요금이 아니라, 원장이 시간을 쓰는 지점이 달라집니다
            </h2>
          </FadeIn>

          <Reveal className="mt-10 border-t border-slate-200" stagger={0.06}>
            {VALUE_ROWS.map((row) => (
              <RevealItem key={row.label}>
                <div className="grid gap-1.5 border-b border-slate-200 py-6 md:grid-cols-[240px_1fr] md:gap-8">
                  <p className="text-[15px] font-bold text-slate-900">{row.label}</p>
                  <p className="text-[15px] leading-relaxed text-slate-600">{row.desc}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* ── 플랜별 기능 비교 — 헤어라인 표 ── */}
      <Section className="border-t border-slate-100 py-16 md:py-24">
        <div className={DOC}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Compare</p>
            <h2 className="mkt-display text-[clamp(1.5rem,3vw,1.875rem)] text-slate-900 md:text-3xl">
              플랜별로 무엇이 포함되나요
            </h2>
          </FadeIn>

          <FadeIn delay={0.08} className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-200">
                  <th className="py-4 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    기능
                  </th>
                  {PRICING_PLANS.map((p) => (
                    <th
                      key={p.name}
                      scope="col"
                      className={cn(
                        'px-4 py-4 text-center text-[13px] font-bold',
                        p.featured ? 'text-emerald-700' : 'text-slate-700'
                      )}
                    >
                      {p.name}
                      {p.featured && (
                        <span className="ml-1.5 text-[11px] font-semibold text-emerald-700">
                          추천
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100">
                    <th
                      scope="row"
                      className="py-4 pr-4 text-left text-[14px] font-medium text-slate-700"
                    >
                      {row.feature}
                    </th>
                    {[row.starter, row.growth, row.pro].map((val, j) => (
                      <td
                        key={j}
                        className={cn(
                          'px-4 py-4 text-center tabular-nums',
                          val === '—' ? 'text-slate-300' : 'text-slate-600'
                        )}
                      >
                        {val === '✓' ? (
                          <>
                            <i aria-hidden className="ri-check-line text-base text-emerald-600" />
                            <span className="sr-only">포함</span>
                          </>
                        ) : val === '—' ? (
                          <>
                            <span aria-hidden>—</span>
                            <span className="sr-only">미포함</span>
                          </>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeIn>
        </div>
      </Section>

      {/* ── 도입 조건 ── */}
      <Section muted className="border-t border-slate-100 py-16 md:py-24">
        <div className={DOC}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Terms</p>
            <h2 className="mkt-display text-[clamp(1.5rem,3vw,1.875rem)] text-slate-900 md:text-3xl">
              결정 전에 확인하실 것
            </h2>
          </FadeIn>

          <Reveal className="mt-10 border-t border-slate-200" stagger={0.05}>
            {TERMS.map((term) => (
              <RevealItem key={term.label}>
                <div className="grid gap-1.5 border-b border-slate-200 py-6 md:grid-cols-[240px_1fr] md:gap-8">
                  <p className="text-[15px] font-bold text-slate-900">{term.label}</p>
                  <p className="text-[15px] leading-relaxed text-slate-600">
                    {term.desc}
                    {'href' in term && term.href && (
                      <Link
                        href={term.href}
                        className={cn(mkt.link, 'group ml-2 inline-flex items-center gap-1')}
                      >
                        {term.hrefLabel}
                        <i
                          aria-hidden
                          className="ri-arrow-right-line transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </Link>
                    )}
                  </p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* ── FAQ — 아코디언 장식 없이 펼쳐진 질문·답 ── */}
      <Section className="border-t border-slate-100 py-16 md:py-24">
        <div className={DOC}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>FAQ</p>
            <h2 className="mkt-display text-[clamp(1.5rem,3vw,1.875rem)] text-slate-900 md:text-3xl">
              자주 묻는 질문
            </h2>
          </FadeIn>

          <FadeIn delay={0.08}>
            <dl className="mt-10 grid border-t border-slate-200 md:grid-cols-2 md:gap-x-14">
              {FAQ_ITEMS.slice(0, 6).map((item) => (
                <div key={item.q} className="border-b border-slate-200 py-6">
                  <dt className="text-[15px] font-bold leading-snug text-slate-900">{item.q}</dt>
                  <dd className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
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
