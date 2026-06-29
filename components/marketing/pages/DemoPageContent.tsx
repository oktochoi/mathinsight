import { DEMO_TOUR_SECTIONS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import type { ScreenshotKey } from '@/lib/marketing/screenshots';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Button } from '@/components/marketing/ui/Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

const DEMO_SCREENSHOT: Record<string, ScreenshotKey> = {
  dashboard: 'dashboard',
  'today-workspace': 'today-lesson',
  'student-detail': 'student-hub',
  'parent-app': 'parent-report',
  billing: 'dashboard',
};

export function DemoPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Demo"
        title="실제 제품을 체험하는 느낌으로"
        description="Dashboard, Today Workspace, Student Detail, Parent App, Billing — EduFlow 핵심 화면을 빠르게 둘러보세요."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험 시작', variant: 'primary' }}
        secondary={{ href: MARKETING_ROUTES.auth, label: '데모 계정 로그인', variant: 'secondary' }}
      />

      <Section muted size="sm">
        <SectionInner narrow>
          <p className={cn(mkt.body, 'text-center')}>
            「데모 수학학원」 샘플 데이터로 운영 흐름을 체험합니다. 로그인 없이 화면을 먼저 보거나, 데모
            계정으로 직접 조작해 볼 수 있습니다.
          </p>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner narrow>
          <nav
            className="flex flex-wrap justify-center gap-2 mb-10"
            aria-label="데모 화면 바로가기"
          >
            {DEMO_TOUR_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </SectionInner>
      </Section>

      {DEMO_TOUR_SECTIONS.map((section, i) => (
        <Section key={section.id} id={section.id} muted={i % 2 === 1}>
          <SectionInner>
            <div
              className={cn(
                'grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16',
                i % 2 === 1 && '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1'
              )}
            >
              <FadeIn>
                <p className={mkt.eyebrow}>Product Tour · {i + 1}/{DEMO_TOUR_SECTIONS.length}</p>
                <h2 className={cn(mkt.h2, 'mt-3 text-xl md:text-2xl')}>{section.title}</h2>
                <p className={cn(mkt.body, 'mt-3 max-w-md')}>{section.desc}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button href={MARKETING_ROUTES.auth} variant="secondary">
                    {section.cta}
                  </Button>
                  <Button href={MARKETING_ROUTES.signup} variant="primary">
                    무료 체험
                  </Button>
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <ScreenshotPlaceholder
                  screenshotKey={DEMO_SCREENSHOT[section.id]}
                  label={`${section.title} Screenshot Placeholder`}
                />
              </FadeIn>
            </div>
          </SectionInner>
        </Section>
      ))}

      <CTASection
        title="체험 후 바로 우리 학원으로 시작하세요"
        description="14일 무료 체험 · 카드 등록 없이 시작"
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.product, label: 'Product 스토리 보기' }}
        variant="light"
      />
    </>
  );
}
