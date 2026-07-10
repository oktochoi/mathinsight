import { CUSTOMER_PILOT, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Badge } from '@/components/marketing/ui/Badge';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export function CustomersPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Customers"
        title="정직한 신뢰 — 파일럿과 원장의 목소리"
        description="과장된 수치 없이, 인터뷰와 Before/After로 EduFlow가 풀려는 문제를 공유합니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '파일럿 참여 문의' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo' }}
      />

      <Section size="sm">
        <SectionInner narrow>
          <FadeIn>
            <div className={cn(mkt.card, 'p-6 md:p-8')}>
              <Badge tone="neutral">{CUSTOMER_PILOT.status}</Badge>
              <p className={cn(mkt.body, 'mt-4')}>{CUSTOMER_PILOT.note}</p>
            </div>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <SectionHeader eyebrow="Voices" title="원장 인터뷰에서" />
          <Reveal className="grid gap-4 md:grid-cols-2">
            {CUSTOMER_PILOT.quotes.map((q) => (
              <RevealItem key={q.text}>
                <blockquote className={cn(mkt.card, 'p-6 md:p-7')}>
                  <p className="text-[15px] leading-relaxed text-zinc-800">「{q.text}」</p>
                  <footer className="mt-4 text-sm text-zinc-500">{q.role}</footer>
                </blockquote>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <SectionHeader eyebrow="Before / After" title="EduFlow가 바꾸려는 것" />
          <div className="space-y-3">
            {CUSTOMER_PILOT.beforeAfter.map((row) => (
              <FadeIn key={row.before}>
                <div className={cn(mkt.card, 'grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:p-6')}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Before</p>
                    <p className="mt-1 text-sm text-zinc-600">{row.before}</p>
                  </div>
                  <span className="text-center text-zinc-300" aria-hidden>
                    →
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">After</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{row.after}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </SectionInner>
      </Section>

      <CTASection
        variant="green"
        title="파일럿 학원을 모집합니다"
        description="상담·재등록 운영 개선에 함께해 주실 학원을 찾습니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '파일럿 문의', variant: 'accent' }}
      />
    </>
  );
}
