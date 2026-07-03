import type { Metadata } from 'next';
import { BRAND_NAME, BRAND_TAGLINE, CONTACT_EMAIL, SITE_URL } from '@/lib/brand';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

/** 검색엔진 색인 대상 마케팅 페이지 (리다이렉트 전용 경로 제외) */
export const MARKETING_SITEMAP_PATHS = [
  MARKETING_ROUTES.home,
  MARKETING_ROUTES.product,
  MARKETING_ROUTES.pricing,
  MARKETING_ROUTES.customers,
  MARKETING_ROUTES.security,
  MARKETING_ROUTES.about,
  MARKETING_ROUTES.contact,
  MARKETING_ROUTES.faq,
  MARKETING_ROUTES.privacy,
  MARKETING_ROUTES.terms,
] as const;

export type PageSeoConfig = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export const MARKETING_PAGE_SEO: Record<string, PageSeoConfig> = {
  home: {
    path: MARKETING_ROUTES.home,
    title: `${BRAND_NAME} — 학원 AI 상담·재등록 운영 플랫폼`,
    description:
      '수업·출결·숙제·성적·상담 기록을 하나로 연결하는 학원 운영 SaaS. AI 상담 브리핑, 학부모 리포트, 재등록 관리까지 eduflowclass.com에서 만나보세요.',
    keywords: [
      '학원 ERP',
      '학원 관리 프로그램',
      '학원 상담',
      '학부모 리포트',
      '재등록 관리',
      '학원 AI',
      'EduFlow',
    ],
  },
  product: {
    path: MARKETING_ROUTES.product,
    title: '기능 소개 — Workflow·AI·학부모 포털',
    description:
      '오늘 수업, 출결·숙제·성적, 상담 카드, Risk Agent, 학부모 포털까지. 학생 기록이 상담 준비가 되는 EduFlow 핵심 기능을 확인하세요.',
    keywords: ['학원 출결', '숙제 관리', '성적 관리', '상담 카드', '학원 AI', 'RAG'],
  },
  pricing: {
    path: MARKETING_ROUTES.pricing,
    title: '요금제 — 학원 규모별 플랜',
    description:
      'Starter·Growth·Pro 플랜 비교. 학생 수·AI 사용량에 맞는 학원 운영 요금. 도입 문의는 okto0914@gmail.com',
    keywords: ['학원 SaaS 요금', '학원 프로그램 가격', 'EduFlow 요금제'],
  },
  customers: {
    path: MARKETING_ROUTES.customers,
    title: '고객 사례 — 학원 운영 Before/After',
    description:
      '상담 준비 시간 단축, 학부모 소통 개선, 재등록 관리 사례. EduFlow를 도입한 학원의 운영 변화를 소개합니다.',
    keywords: ['학원 사례', '학원 도입', '상담 운영'],
  },
  security: {
    path: MARKETING_ROUTES.security,
    title: '보안·개인정보 — 학원 데이터 보호',
    description:
      '학원별 데이터 분리, 권한 관리, AI 처리 원칙. EduFlow의 보안 정책과 개인정보 보호 방침 요약.',
    keywords: ['학원 데이터 보안', '개인정보', '교육 SaaS 보안'],
  },
  about: {
    path: MARKETING_ROUTES.about,
    title: '회사 소개 — 에듀플로우',
    description:
      '학원 ERP가 아닌 AI 상담 운영 시스템을 만듭니다. 기록→분석→상담→학부모 전달→재등록 Workflow를 연결하는 에듀플로우를 소개합니다.',
    keywords: ['에듀플로우', 'EduFlow 회사', '학원 스타트업', '교육 SaaS'],
  },
  contact: {
    path: MARKETING_ROUTES.contact,
    title: '도입 문의 — 데모·상담 신청',
    description:
      '무료 데모, 파일럿, Enterprise 도입 문의. 영업일 기준 1–2일 내 회신. 문의 메일: okto0914@gmail.com',
    keywords: ['학원 프로그램 문의', 'EduFlow 데모', '학원 SaaS 도입'],
  },
  faq: {
    path: MARKETING_ROUTES.faq,
    title: '자주 묻는 질문 FAQ',
    description:
      '엑셀·기존 ERP 이전, AI 데이터 사용, 학부모 포털, 무료 체험, 보안 관련 자주 묻는 질문과 답변.',
    keywords: ['학원 프로그램 FAQ', 'EduFlow 질문'],
  },
  privacy: {
    path: MARKETING_ROUTES.privacy,
    title: '개인정보처리방침',
    description:
      'EduFlow(eduflowclass.com) 개인정보 수집·이용·보관·파기 및 이용자 권리 안내. 문의: okto0914@gmail.com',
    keywords: ['개인정보처리방침', 'EduFlow 개인정보'],
  },
  terms: {
    path: MARKETING_ROUTES.terms,
    title: '이용약관',
    description:
      'EduFlow 서비스 이용약관. 회원 가입, 서비스 이용, 요금, 데이터 소유권, 면책 조항. 문의: okto0914@gmail.com',
    keywords: ['이용약관', 'EduFlow 약관'],
  },
};

/** 리다이렉트 전용 경로 — 검색 색인 제외 */
export const REDIRECT_PAGE_SEO = {
  demo: {
    path: MARKETING_ROUTES.demo,
    title: 'Demo',
    description: 'EduFlow 데모 체험',
    noIndex: true,
  },
  workflow: {
    path: MARKETING_ROUTES.workflow,
    title: 'Workflow',
    description: 'EduFlow Workflow',
    noIndex: true,
  },
  ai: {
    path: MARKETING_ROUTES.ai,
    title: 'AI',
    description: 'EduFlow AI',
    noIndex: true,
  },
  resources: {
    path: MARKETING_ROUTES.resources,
    title: 'Resources',
    description: 'EduFlow 자료',
    noIndex: true,
  },
} as const satisfies Record<string, PageSeoConfig>;

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex,
}: PageSeoConfig): Metadata {
  const canonical = path.startsWith('http') ? path : `${SITE_URL}${path}`;
  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(', '),
    metadataBase: new URL(SITE_URL),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: canonical,
      siteName: BRAND_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export function buildMarketingMetadata(key: keyof typeof MARKETING_PAGE_SEO): Metadata {
  return buildPageMetadata(MARKETING_PAGE_SEO[key]);
}

export function buildRedirectMetadata(key: keyof typeof REDIRECT_PAGE_SEO): Metadata {
  return buildPageMetadata(REDIRECT_PAGE_SEO[key]);
}

/** 루트 레이아웃 기본 메타 */
export const ROOT_SITE_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: MARKETING_PAGE_SEO.home.description,
  applicationName: BRAND_NAME,
  authors: [{ name: BRAND_NAME, url: SITE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: MARKETING_PAGE_SEO.home.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: MARKETING_PAGE_SEO.home.description,
  },
  robots: { index: true, follow: true },
  verification: {
    google: '5bOPWZt2rr_10il4OGVPNer8U16o-uWLR8FKk1FHWa0',
    other: {
      'naver-site-verification': 'c3f408ce74df2683f4565578086dbf2c19c01c34',
    },
  },
  other: {
    'contact:email': CONTACT_EMAIL,
  },
};
