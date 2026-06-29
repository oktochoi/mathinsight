import Link from 'next/link';
import { HOME_PROBLEMS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHero } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { ProblemCard } from '@/components/marketing/ui/FeatureSection';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

/** Home — 10초 안에 EduFlow 이해, Product로 자연스럽게 연결 */
export function HomePageContent() {
  return (
    <>
      <PageHero
        eyebrow="EduFlow"
        title="학생 기록이 상담 준비가 되는 학원 운영 SaaS"
        description="기존 ERP는 데이터를 쌓습니다. EduFlow는 원장이 학생을 이해하고, 상담하고, 학부모에게 전달하는 흐름을 만듭니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험' }}
        secondary={{ href: MARKETING_ROUTES.product, label: 'Product 보기', variant: 'secondary' }}
        tone="peach"
        align="center"
      />

      <Section muted size="sm">
        <SectionInner narrow>
          <Reveal className="grid gap-4 sm:grid-cols-3">
            {[
              { q: 'EduFlow가 무엇인가요?', a: 'AI Native 학원 운영 SaaS' },
              { q: '어떤 문제를 해결하나요?', a: '상담 준비·기록 분산·학부모 소통' },
              { q: '왜 ERP보다 좋은가요?', a: '기록이 곧 상담 스토리가 됩니다' },
            ].map((item) => (
              <RevealItem key={item.q}>
                <div className={cn(mkt.card, 'p-5 text-center')}>
                  <p className="text-xs font-semibold text-slate-500">{item.q}</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{item.a}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <SectionHeader
            eyebrow="Problem"
            title="이런 어려움이 있으신가요?"
            align="center"
          />
          <Reveal className="grid gap-4 md:grid-cols-3 mt-6">
            {HOME_PROBLEMS.map((p) => (
              <RevealItem key={p.title}>
                <ProblemCard title={p.title} desc={p.desc} />
              </RevealItem>
            ))}
          </Reveal>
          <FadeIn className="text-center mt-8">
            <Link href={`${MARKETING_ROUTES.product}#solution`} className={mkt.link}>
              EduFlow가 어떻게 해결하는지 보기 →
            </Link>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <div className="mx-auto max-w-2xl text-center">
            <p className={mkt.eyebrow}>Why EduFlow</p>
            <h2 className={cn(mkt.h2, 'mt-3')}>
              ERP가 아닌, 상담·재등록 운영 시스템
            </h2>
            <p className={cn(mkt.lead, 'mt-4')}>
              수업 입력 → AI 브리핑 → 상담 → 학부모 전달 → 재등록까지 하나의 Workflow.
              메뉴를 옮겨 다닐 필요 없이 스크롤만으로 이해할 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link href={`${MARKETING_ROUTES.product}#workflow`} className={mkt.btnOutline}>
                Workflow 보기
              </Link>
              <Link href={MARKETING_ROUTES.demo} className={mkt.btnAccent}>
                Demo 체험
              </Link>
            </div>
          </div>
        </SectionInner>
      </Section>

      <CTASection
        variant="green"
        title="14일 무료 체험 — 카드 등록 없이 시작"
        description="Demo Academy로 먼저 둘러보거나, 바로 우리 학원 데이터로 시작할 수 있습니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험 시작', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo 먼저 보기' }}
      />
    </>
  );
}
