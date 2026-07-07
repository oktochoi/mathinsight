import {
  DEMO_TOUR_SECTIONS,
  MARKETING_ROUTES,
  PRODUCT_AI_CAPABILITIES,
  PRODUCT_IMPACT_METRICS,
  PRODUCT_PROBLEMS,
  PRODUCT_WORKFLOW_STEPS,
} from '@/lib/marketing/siteStructure';
import { PageHero } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { ProblemCard } from '@/components/marketing/ui/FeatureSection';
import { PremiumWorkflowTimeline } from '@/components/marketing/ui/PremiumWorkflowTimeline';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Badge } from '@/components/marketing/ui/Badge';
import { ScreenTour } from '@/components/marketing/ui/ScreenTour';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export function ProductPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Product"
        title={
          <>
            <span className="block leading-[1.3]">학생 기록이 상담 준비가 되는</span>
            <span className="mt-3 block leading-[1.3] md:mt-4">AI Native 학원 운영 SaaS</span>
          </>
        }
        description="수업 기록 → AI 브리핑 → 상담 → 학부모 전달 → 재등록. 하나의 흐름입니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '3일 무료 체험' }}
        secondary={{ href: '#tour', label: '화면 둘러보기', variant: 'secondary' }}
        tone="sky"
      >
        <ScreenshotPlaceholder screenshotKey="dashboard" priority />
      </PageHero>

      <Section id="problem" muted>
        <SectionInner>
          <SectionHeader
            eyebrow="Problem"
            title="기록은 쌓이는데, 상담 준비는 수동"
          />
          <Reveal className="grid gap-4 md:grid-cols-3">
            {PRODUCT_PROBLEMS.map((p) => (
              <RevealItem key={p.title}>
                <ProblemCard title={p.title} desc={p.desc} />
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section id="solution">
        <SectionInner>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <FadeIn>
              <SectionHeader
                eyebrow="Solution"
                title="입력만 하면 상담 스토리가 됩니다"
              />
              <p className={cn(mkt.body, 'mt-3 max-w-md')}>
                타임라인 · AI 브리핑 · 리포트가 같은 맥락을 유지합니다.
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <ScreenshotPlaceholder screenshotKey="student-hub" />
            </FadeIn>
          </div>
        </SectionInner>
      </Section>

      <Section id="workflow" className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Workflow"
            title="6 → 1 → 2 단계"
            description="수업 기록 6단계 · AI 요약 · 전달·재등록 2단계"
            align="center"
          />
          <div className="mt-10">
            <PremiumWorkflowTimeline steps={PRODUCT_WORKFLOW_STEPS} />
          </div>
        </SectionInner>
      </Section>

      <Section id="ai" muted className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="AI Engine"
            title="RAG·Agent가 Workflow를 돕습니다"
            description="기록을 쌓는 ERP가 아니라, 맥락을 이해하는 AI 레이어"
            align="center"
          />
          <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_AI_CAPABILITIES.map((f) => (
              <RevealItem key={f.id}>
                <article className={cn(mkt.card, 'p-5 h-full border-indigo-50')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 text-lg">
                      <i className={f.icon} />
                    </span>
                    <Badge tone="ai">{f.tag}</Badge>
                  </div>
                  <h3 className={cn(mkt.h3, 'mt-3 text-base')}>{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{f.desc}</p>
                </article>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section id="tour" className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Product Tour"
            title="핵심 화면"
            description="화면마다 레이아웃이 다릅니다 — 데모로 직접 조작해 보세요."
            align="center"
          />
          <div className="mt-6">
            <ScreenTour
              sections={DEMO_TOUR_SECTIONS as unknown as Array<{ id: string; title: string; desc: string; cta: string }>}
              demoHref={MARKETING_ROUTES.auth}
              signupHref={MARKETING_ROUTES.signup}
            />
          </div>
        </SectionInner>
      </Section>

      <Section id="impact" muted className="scroll-mt-20">
        <SectionInner narrow>
          <SectionHeader
            eyebrow="Impact"
            title="원장이 체감하는 변화"
            align="center"
          />
          <Reveal className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PRODUCT_IMPACT_METRICS.map((m) => (
              <RevealItem key={m.label}>
                <div className={cn(mkt.card, 'p-4 text-center')}>
                  <p className="text-2xl font-extrabold text-sky-700">{m.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{m.label}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <CTASection
        variant="blue"
        title="3일 무료로 Workflow 확인"
        description="카드 없이 시작 · 데모 계정 제공"
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.auth, label: '데모 로그인' }}
      />
    </>
  );
}
