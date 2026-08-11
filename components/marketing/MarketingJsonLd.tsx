import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
  COMPANY_LEGAL_NAME,
  CONTACT_EMAIL,
  SITE_URL,
} from '@/lib/brand';
import { SITE_OG_IMAGE_ABSOLUTE } from '@/lib/marketing/siteAssets';

export function MarketingJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY_LEGAL_NAME,
    alternateName: BRAND_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description: '학원 학생 관리, 상담 기록, 학부모 상담 및 재등록 관리를 위한 학원 운영 서비스',
    logo: SITE_OG_IMAGE_ABSOLUTE,
    sameAs: [SITE_URL],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: SITE_URL,
    description: BRAND_DESCRIPTION,
    inLanguage: 'ko-KR',
    publisher: {
      '@type': 'Organization',
      name: COMPANY_LEGAL_NAME,
      url: SITE_URL,
    },
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: BRAND_DESCRIPTION,
    author: { '@type': 'Organization', name: COMPANY_LEGAL_NAME },
    image: SITE_OG_IMAGE_ABSOLUTE,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      description: '학원 상담·학생 관리·재등록 관리를 위한 학원 운영 프로그램. 행사 기간 중 전 기능 무료.',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
