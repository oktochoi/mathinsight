import {
  MARKETING_ROUTES,
  PRODUCT_AI_POINTS,
  PRODUCT_IMPACT_METRICS,
  PRODUCT_KEY_FEATURES,
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
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

/** Product — Workflow·AI·Resources를 하나의 스토리로 통합 */
export function ProductPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Product"
        title={
          <>
            학생 기록이 상담 준비가 되는
            <br />
            AI Native 학원 운영 SaaS
          </>
        }
        description="EduFlow는 수업 기록부터 상담·학부모 전달·재등록까지 하나의 흐름으로 연결합니다. 기존 ERP처럼 데이터를 쌓는 것이 아니라, 원장이 학생을 이해하고 상담하는 데 필요한 스토리를 만듭니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo 둘러보기', variant: 'secondary' }}
        tone="sky"
      >
        <ScreenshotPlaceholder label="Hero Product Screenshot Placeholder" />
      </PageHero>

      <Section id="problem" muted>
        <SectionInner>
          <SectionHeader
            eyebrow="Problem"
            title="기존 학원 운영의 문제"
            description="기록은 쌓이지만, 상담과 재등록을 위한 준비는 여전히 수동입니다."
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
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <FadeIn>
              <SectionHeader
                eyebrow="Solution"
                title="기록이 곧 상담 준비가 됩니다"
                description="EduFlow는 수업 입력만으로 상담 브리핑·학부모 리포트·재등록 판단의 기반을 만듭니다. ERP처럼 화면을 나누지 않고, 학생 중심의 하나의 흐름으로 설계했습니다."
              />
              <ul className="mt-6 space-y-3">
                {[
                  '수업·출결·숙제·성적이 학생 타임라인에 연결됩니다.',
                  '상담 전 30초 브리핑으로 준비 시간을 줄입니다.',
                  '학부모 전달과 재등록 관리가 같은 맥락을 유지합니다.',
                ].map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-sky-600 font-bold">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.08}>
              <ScreenshotPlaceholder screenshotKey="dashboard" />
            </FadeIn>
          </div>
        </SectionInner>
      </Section>

      <Section id="workflow" muted className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Workflow"
            title="기록 → 상담 → 재등록, 하나의 흐름"
            description="Workflow 메뉴 없이 Product 안에서 전체 운영 스토리를 확인하세요."
            align="center"
          />
          <div className="mt-10">
            <PremiumWorkflowTimeline steps={PRODUCT_WORKFLOW_STEPS} />
          </div>
        </SectionInner>
      </Section>

      <Section id="features" className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Key Features"
            title="Workflow를 지원하는 핵심 기능"
            description="Resources·AI 메뉴에 흩어져 있던 내용을 기능 카드로 정리했습니다."
          />
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_KEY_FEATURES.map((f) => (
              <RevealItem key={f.id}>
                <article className={cn(mkt.card, 'p-6 h-full')}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 text-lg">
                    <i className={f.icon} />
                  </span>
                  <h3 className={cn(mkt.h3, 'mt-4')}>{f.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{f.desc}</p>
                </article>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section id="ai" muted className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="AI Assistant"
            title="AI는 운영을 돕는 Assistant Layer"
            description="AI를 주인공처럼 보이지 않습니다. 원장의 판단 옆에서 기록을 정리하고 제안합니다."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {PRODUCT_AI_POINTS.map((item) => (
              <FadeIn key={item.title}>
                <article className={cn(mkt.card, 'p-6 h-full border-indigo-100')}>
                  <Badge tone="ai">Assistant</Badge>
                  <h3 className={cn(mkt.h3, 'mt-3')}>{item.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{item.desc}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </SectionInner>
      </Section>

      <Section id="impact" className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Impact"
            title="EduFlow를 쓰면 달라지는 운영"
            description="과장된 수치 대신, 원장이 체감하는 운영 변화에 집중합니다."
            align="center"
          />
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            {PRODUCT_IMPACT_METRICS.map((m) => (
              <RevealItem key={m.label}>
                <div className={cn(mkt.card, 'p-5 text-center')}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-sky-700">{m.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{m.sub}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="app-chart-placeholder min-h-[10rem] rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 text-sm text-slate-500 flex items-center justify-center">
              [ Chart Placeholder — Consultation Prep Time ]
            </div>
            <div className="app-chart-placeholder min-h-[10rem] rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 text-sm text-slate-500 flex items-center justify-center">
              [ Chart Placeholder — Retention Management Trend ]
            </div>
          </div>
        </SectionInner>
      </Section>

      <div id="cta">
        <CTASection
          variant="blue"
        title="우리 학원 Workflow를 무료로 확인해 보세요"
        description="14일 무료 체험 · 카드 등록 없이 시작 · Demo Academy로 먼저 둘러볼 수도 있습니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo 둘러보기' }}
        />
      </div>
    </>
  );
}
