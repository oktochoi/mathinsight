import Link from 'next/link';
import { FAQ_ITEMS, MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { FAQSection } from '@/components/marketing/ui/FAQSection';
import { mkt } from '@/lib/marketing/ui';

export function FaqPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="FAQ"
        title="구매 전 자주 묻는 질문"
        primary={{ href: MARKETING_ROUTES.contact, label: '문의하기' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: 'Demo' }}
      />

      <Section>
        <SectionInner>
          <FAQSection items={FAQ_ITEMS} defaultOpen={0} />
        </SectionInner>
      </Section>

      <Section muted size="sm">
        <SectionInner narrow>
          <p className="text-center text-sm text-zinc-600">
            더 궁금한 점은{' '}
            <Link href={MARKETING_ROUTES.contact} className={mkt.link}>
              Contact
            </Link>
            또는{' '}
            <Link href={MARKETING_ROUTES.security} className={mkt.link}>
              Security
            </Link>
            를 참고하세요.
          </p>
        </SectionInner>
      </Section>
    </>
  );
}
