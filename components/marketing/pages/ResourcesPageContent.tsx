import Link from 'next/link';
import { MARKETING_ROUTES, RESOURCES_ITEMS } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { Badge } from '@/components/marketing/ui/Badge';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

export function ResourcesPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Resources"
        title="학원 상담·재등록 운영 콘텐츠"
        description="가이드, 팁, 업데이트 — EduFlow와 함께 쓰는 운영 지식."
        primary={{ href: MARKETING_ROUTES.workflow, label: 'Workflow 가이드' }}
        secondary={{ href: MARKETING_ROUTES.faq, label: 'FAQ' }}
      />

      <Section>
        <SectionInner narrow>
          <ul className="divide-y divide-zinc-200">
            {RESOURCES_ITEMS.map((item) => (
              <FadeIn key={item.title}>
                <li className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Badge tone={item.tag === 'AI' ? 'ai' : 'neutral'}>{item.tag}</Badge>
                    <h2 className="text-base font-semibold text-zinc-900">{item.title}</h2>
                    <p className="text-sm text-zinc-600">{item.desc}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">준비 중</span>
                </li>
              </FadeIn>
            ))}
          </ul>
        </SectionInner>
      </Section>

      <Section muted size="sm">
        <SectionInner narrow>
          <p className="text-center text-sm text-zinc-600">
            콘텐츠는 파일럿 학원 피드백을 반영해 순차 공개합니다.{' '}
            <Link href={MARKETING_ROUTES.contact} className={mkt.link}>
              알림 신청
            </Link>
          </p>
        </SectionInner>
      </Section>
    </>
  );
}
