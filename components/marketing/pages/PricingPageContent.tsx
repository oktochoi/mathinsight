import { cn } from '@/lib/cn';
import {
  FAQ_ITEMS,
  MARKETING_ROUTES,
  PRICING_AUDIENCE,
  PRICING_PLANS,
  PRICING_VALUE_PROPS,
} from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FAQSection } from '@/components/marketing/ui/FAQSection';
import { Button } from '@/components/marketing/ui/Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { mkt } from '@/lib/marketing/ui';

export function PricingPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Pricing"
        title="가격이 아니라, 운영 가치를 선택하세요"
        description="EduFlow는 상담 준비·학생 이해·학부모 소통·재등록 관리를 하나의 Workflow로 연결합니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo 먼저 보기', variant: 'secondary' }}
      />

      <Section>
        <SectionInner>
          <SectionHeader
            eyebrow="Value"
            title="왜 이 가격을 지불해야 하나요?"
            description="기능 목록이 아니라, 원장이 매일 체감하는 운영 변화에 집중합니다."
          />
          <Reveal className="grid gap-4 md:grid-cols-3 mt-6">
            {PRICING_VALUE_PROPS.map((v) => (
              <RevealItem key={v.title}>
                <article className={cn(mkt.card, 'p-6 h-full')}>
                  <h3 className={cn(mkt.h3)}>{v.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{v.desc}</p>
                </article>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <SectionHeader eyebrow="Plans" title="학원 규모별 플랜" align="center" />
          <Reveal className="grid gap-5 lg:grid-cols-3 mt-8">
            {PRICING_PLANS.map((plan) => (
              <RevealItem key={plan.name}>
                <article
                  className={cn(
                    'relative flex h-full flex-col rounded-2xl border bg-white p-7',
                    plan.featured ? 'border-sky-500 shadow-lg shadow-sky-500/15' : 'border-slate-200'
                  )}
                >
                  {plan.featured && (
                    <span className="absolute top-5 right-5 rounded-full bg-gradient-to-b from-lime-500 to-green-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      추천
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-zinc-900">{plan.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">학생 {plan.students}</p>
                  <p className={cn(mkt.muted, 'mt-2')}>{plan.desc}</p>
                  <div className="my-6 flex items-baseline gap-0.5">
                    {plan.price !== '문의' && <span className="text-zinc-400">₩</span>}
                    <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                    {plan.price !== '문의' && <span className="text-sm text-zinc-400">/월</span>}
                  </div>
                  <ul className="mb-8 flex-1 space-y-2 text-sm text-zinc-600">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-zinc-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    href={plan.price === '문의' ? MARKETING_ROUTES.contact : MARKETING_ROUTES.signup}
                    variant={plan.featured ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {plan.price === '문의' ? '도입 문의' : '무료 체험'}
                  </Button>
                </article>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <SectionHeader eyebrow="For" title="이런 학원에 맞습니다" />
          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            {PRICING_AUDIENCE.map((a) => (
              <FadeIn key={a.label}>
                <div className={cn(mkt.card, 'p-5')}>
                  <p className="text-sm font-bold text-sky-700">{a.label}</p>
                  <p className={cn(mkt.muted, 'mt-1')}>{a.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <SectionHeader eyebrow="FAQ" title="자주 묻는 질문" align="center" />
          <div className="mt-8">
            <FAQSection items={FAQ_ITEMS.slice(0, 6)} defaultOpen={0} />
          </div>
        </SectionInner>
      </Section>

      <CTASection
        variant="blue"
        title="14일 무료 체험으로 시작하세요"
        description="카드 등록 없이 시작 · Demo로 먼저 확인 가능"
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.contact, label: '도입 문의' }}
      />
    </>
  );
}
