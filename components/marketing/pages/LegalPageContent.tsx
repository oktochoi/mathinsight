import Link from 'next/link';
import {
  COMPANY_DOMAIN,
  COMPANY_LEGAL_NAME,
  COMPANY_SERVICE_NAME,
  CONTACT_EMAIL,
  SITE_URL,
} from '@/lib/brand';
import {
  LEGAL_EFFECTIVE_DATE,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
} from '@/lib/marketing/legalContent';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

function LegalContactFooter() {
  return (
    <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">문의</p>
      <p className="mt-2">
        본 문서와 관련한 문의는 아래 이메일로 연락해 주세요.
      </p>
      <p className="mt-3">
        <strong className="text-slate-800">문의 메일:</strong>{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-700 hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className="mt-1">
        <strong className="text-slate-800">공식 사이트:</strong>{' '}
        <a href={SITE_URL} className="text-sky-700 hover:underline">
          {COMPANY_DOMAIN}
        </a>
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {COMPANY_LEGAL_NAME} · {COMPANY_SERVICE_NAME}
      </p>
    </div>
  );
}

export function LegalPageContent({ type }: { type: 'privacy' | 'terms' }) {
  const isPrivacy = type === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <>
      <PageHeroMinimal
        eyebrow="Legal"
        title={isPrivacy ? '개인정보처리방침' : '이용약관'}
        description={`시행일: ${LEGAL_EFFECTIVE_DATE} · ${COMPANY_SERVICE_NAME}(${COMPANY_DOMAIN})`}
      />
      <Section>
        <SectionInner narrow>
          <FadeIn className={mkt.prose}>
            <p className="text-sm text-slate-500">
              {COMPANY_LEGAL_NAME}(이하 &quot;회사&quot;)가 운영하는 {COMPANY_SERVICE_NAME} 서비스의{' '}
              {isPrivacy ? '개인정보 처리' : '이용'}에 관한 안내입니다. 관련 문의는{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 보내 주세요.
            </p>

            {sections.map((section) => (
              <div key={section.title}>
                <h2>{section.title}</h2>
                {section.body.split('\n\n').map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            ))}

            {!isPrivacy && (
              <p>
                개인정보 처리에 관한 자세한 내용은{' '}
                <Link href={MARKETING_ROUTES.privacy} className="text-sky-700 hover:underline">
                  개인정보처리방침
                </Link>
                을 참고해 주세요.
              </p>
            )}

            <LegalContactFooter />
          </FadeIn>
        </SectionInner>
      </Section>
    </>
  );
}
