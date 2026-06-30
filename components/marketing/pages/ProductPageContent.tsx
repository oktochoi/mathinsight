import {
  DEMO_TOUR_SECTIONS,
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
import { VideoPlaceholder } from '@/components/marketing/ui/VideoPlaceholder';
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
      {/* ── HERO ──────────────────────────────────── */}
      <PageHero
        eyebrow="Product"
        title={
          <>
            학생 기록이 상담 준비가 되는
            <br />
            AI Native 학원 운영 SaaS
          </>
        }
        description="EduFlow는 수업 기록부터 상담·학부모 전달·재등록까지 하나의 흐름으로 연결합니다. ERP처럼 데이터를 쌓는 것이 아니라, 원장이 학생을 이해하고 상담하는 데 필요한 스토리를 만듭니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '3일 무료 체험' }}
        secondary={{ href: '#tour', label: '화면 둘러보기', variant: 'secondary' }}
        tone="sky"
      >
        <ScreenshotPlaceholder screenshotKey="dashboard" priority />
      </PageHero>

      {/* ── PROBLEM ────────────────────────────────── */}
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

      {/* ── SOLUTION ───────────────────────────────── */}
      <Section id="solution">
        <SectionInner>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <FadeIn>
              <SectionHeader
                eyebrow="Solution"
                title="기록이 곧 상담 준비가 됩니다"
                description="EduFlow는 수업 입력만으로 상담 브리핑·학부모 리포트·재등록 판단의 기반을 만듭니다."
              />
              <ul className="mt-6 space-y-3">
                {[
                  '수업·출결·숙제·성적이 학생 타임라인에 연결됩니다.',
                  '상담 전 30초 브리핑으로 준비 시간을 줄입니다.',
                  '학부모 전달과 재등록 관리가 같은 맥락을 유지합니다.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs">
                      <i className="ri-check-line" />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.08}>
              <ScreenshotPlaceholder screenshotKey="student-hub" />
            </FadeIn>
          </div>
        </SectionInner>
      </Section>

      {/* ── 소개 영상 ───────────────────────────────── */}
      <Section muted size="sm">
        <SectionInner narrow>
          <VideoPlaceholder
            title="EduFlow 전체 Workflow 소개"
            subtitle="수업 기록부터 재등록까지 — 5분 투어"
            duration="4:52"
            accent="sky"
          />
        </SectionInner>
      </Section>

      {/* ── WORKFLOW ───────────────────────────────── */}
      <Section id="workflow" className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Workflow"
            title="기록 → 상담 → 재등록, 하나의 흐름"
            description="메뉴를 옮겨 다닐 필요 없이 스크롤만으로 이해할 수 있습니다."
            align="center"
          />
          <div className="mt-10">
            <PremiumWorkflowTimeline steps={PRODUCT_WORKFLOW_STEPS} />
          </div>
        </SectionInner>
      </Section>

      {/* ── KEY FEATURES ───────────────────────────── */}
      <Section id="features" muted className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Key Features"
            title="Workflow를 지원하는 핵심 기능"
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

      {/* ── AI ASSISTANT ───────────────────────────── */}
      <Section id="ai" className="scroll-mt-20">
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

      {/* ── SCREEN TOUR ────────────────────────────── */}
      <Section id="tour" muted className="scroll-mt-20">
        <SectionInner>
          <SectionHeader
            eyebrow="Product Tour"
            title="핵심 화면 직접 확인"
            description="「데모 수학학원」 샘플 데이터 기준 — 데모 계정으로 직접 조작해 볼 수도 있습니다."
            align="center"
          />
          <div className="mt-8">
            <ScreenTour
              sections={DEMO_TOUR_SECTIONS as unknown as Array<{ id: string; title: string; desc: string; cta: string }>}
              demoHref={MARKETING_ROUTES.auth}
              signupHref={MARKETING_ROUTES.signup}
            />
          </div>
        </SectionInner>
      </Section>

      {/* ── IMPACT ─────────────────────────────────── */}
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
        </SectionInner>
      </Section>

      {/* ── CTA ────────────────────────────────────── */}
      <CTASection
        variant="blue"
        title="우리 학원 Workflow를 3일 무료로 확인해 보세요"
        description="3일 무료 체험 · 카드 등록 없이 시작 · 데모 계정으로 먼저 둘러볼 수도 있습니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.auth, label: '데모 계정 로그인' }}
      />
    </>
  );
}
