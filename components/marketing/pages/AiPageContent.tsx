import Link from 'next/link';
import { AI_FEATURES, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import type { ScreenshotKey } from '@/lib/marketing/screenshots';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { FeatureSection } from '@/components/marketing/ui/FeatureSection';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { mkt } from '@/lib/marketing/ui';

const AI_SCREENSHOT: Record<string, ScreenshotKey> = {
  summary: 'ai-summary',
  risk: 'ai-risk',
  'counseling-card': 'ai-counseling-card',
  'parent-report': 'ai-parent-report',
  retention: 'reregistration',
};

export function AiPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="AI"
        title="기술이 아니라, 상담 전에 얻는 결과"
        description="원장과 상담 담당자가 실제로 받는 정리·카드·리포트를 설명합니다."
        primary={{ href: MARKETING_ROUTES.demo, label: 'AI Demo' }}
        secondary={{ href: MARKETING_ROUTES.workflow, label: 'Workflow' }}
      />

      <Section>
        <SectionInner className="space-y-20 md:space-y-28">
          {AI_FEATURES.map((feat, i) => (
            <FeatureSection
              key={feat.id}
              id={feat.id}
              badge={feat.id === 'risk' || feat.id === 'retention' ? '관리 필요' : '결과'}
              badgeTone={feat.id === 'risk' || feat.id === 'retention' ? 'risk' : 'ai'}
              title={feat.title}
              description={feat.outcome}
              className={i % 2 === 1 ? '[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1' : undefined}
            >
              <div className="space-y-4">
                <blockquote className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900">
                  {feat.example}
                </blockquote>
                <ScreenshotPlaceholder screenshotKey={AI_SCREENSHOT[feat.id] ?? 'ai-summary'} />
              </div>
            </FeatureSection>
          ))}
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner narrow>
          <p className="text-center text-sm text-zinc-600">
            AI는 해당 학원이 기록한 데이터만 사용합니다.{' '}
            <Link href={MARKETING_ROUTES.security} className={mkt.link}>
              Security
            </Link>
            에서 원칙을 확인하세요.
          </p>
        </SectionInner>
      </Section>

      <CTASection
        variant="blue"
        title="상담 전 5분, AI가 준비합니다"
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo' }}
      />
    </>
  );
}
