import { MARKETING_ROUTES, SECURITY_TOPICS } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export function SecurityPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Security"
        title="학생 정보, 맡겨도 될까요?"
        description="학원 원장이 판단할 수 있도록 — 개인정보·권한·AI 사용 원칙을 투명하게 공개합니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '보안 문의' }}
        secondary={{ href: MARKETING_ROUTES.faq, label: 'FAQ' }}
      />

      <Section>
        <SectionInner>
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_TOPICS.map((topic) => (
              <RevealItem key={topic.title}>
                <article className={cn(mkt.card, 'p-6')}>
                  <h2 className="font-semibold text-zinc-900">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{topic.desc}</p>
                </article>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner narrow>
          <SectionHeader eyebrow="Principle" title="AI 데이터 원칙" />
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
            <li>해당 학원(tenant) 기록만 참조합니다.</li>
            <li>타 학원 데이터와 섞이지 않습니다.</li>
            <li>외부 모델 학습용으로 학생 데이터를 제공하지 않습니다.</li>
            <li>역할별 접근 권한으로 최소 노출을 적용합니다.</li>
          </ul>
        </SectionInner>
      </Section>

      <CTASection
        title="Enterprise 보안·감사 요구사항"
        primary={{ href: MARKETING_ROUTES.contact, label: '문의하기', variant: 'accent' }}
        variant="light"
      />
    </>
  );
}
