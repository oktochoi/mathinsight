import type { Metadata } from 'next';
import { BRAND_NAME, BRAND_TAGLINE, CONTACT_EMAIL, SITE_URL } from '@/lib/brand';
import {
  SITE_APPLE_TOUCH_ICON,
  SITE_FAVICON,
  SITE_MANIFEST,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_HEIGHT,
  SITE_OG_IMAGE_WIDTH,
} from '@/lib/marketing/siteAssets';
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
  MARKETING_ROUTES.academyManagement,
  MARKETING_ROUTES.academyConsulting,
  MARKETING_ROUTES.studentManagement,
  MARKETING_ROUTES.retention,
  MARKETING_ROUTES.blog,
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
    title: '학원 상담·재등록 관리 프로그램',
    description:
      'EduFlow는 학생 관리, 수업 기록, 상담 기록, 학부모 상담과 재등록 관리를 하나로 연결하는 AI 학원 운영 프로그램입니다. 흩어진 기록을 상담 준비로, 상담을 재등록 관리로 이어줍니다.',
    keywords: [
      '학원 관리 프로그램',
      '학원 상담 프로그램',
      '학원 학생 관리',
      '학원 재등록 관리',
      '학원 운영 프로그램',
      '학부모 상담',
      'AI 학원 관리',
      'EduFlow',
    ],
  },
  product: {
    path: MARKETING_ROUTES.product,
    title: '학원 운영 기능 — 수업 기록부터 학부모 리포트까지',
    description:
      '출결·숙제·성적 기록, 상담 준비 브리핑, 학부모 포털, 재등록 관리까지. EduFlow가 학원 운영의 전 과정을 어떻게 연결하는지 확인하세요.',
    keywords: ['학원 출결 관리', '숙제 관리', '학원 성적 관리', '상담 카드', '학부모 리포트', '학원 운영 프로그램'],
  },
  pricing: {
    path: MARKETING_ROUTES.pricing,
    title: '학원 관리 프로그램 요금제 비교',
    description:
      '학생 수와 학원 규모에 맞는 Starter·Growth·Pro 요금제를 비교하세요. 행사 기간 중 전 기능 무료로 이용할 수 있습니다.',
    keywords: ['학원 프로그램 가격', '학원 관리 요금', '학원 SaaS 요금제'],
  },
  customers: {
    path: MARKETING_ROUTES.customers,
    title: '학원 도입 사례 — 상담·재등록 운영 개선',
    description:
      '상담 준비 시간 단축, 학부모 소통 개선, 재등록 관리 체계화. EduFlow를 도입한 학원의 운영 변화를 소개합니다.',
    keywords: ['학원 도입 사례', '학원 운영 개선', '학원 상담 사례'],
  },
  security: {
    path: MARKETING_ROUTES.security,
    title: '학원 데이터 보안 정책',
    description:
      '학원별 데이터 분리, 역할 기반 권한 관리, AI 데이터 처리 원칙. EduFlow의 학생 개인정보 보호와 보안 정책을 확인하세요.',
    keywords: ['학원 데이터 보안', '학생 개인정보 보호', '교육 SaaS 보안'],
  },
  about: {
    path: MARKETING_ROUTES.about,
    title: '에듀플로우 소개 — 학원 상담 운영 서비스',
    description:
      '학원의 수업 기록이 상담 준비가 되고, 상담이 재등록까지 이어지는 흐름을 만듭니다. EduFlow를 만드는 팀을 소개합니다.',
    keywords: ['에듀플로우', 'EduFlow', '학원 운영 서비스'],
  },
  contact: {
    path: MARKETING_ROUTES.contact,
    title: '도입 문의 — 데모·상담 신청',
    description:
      'EduFlow 도입 상담, 무료 데모 체험, Enterprise 문의를 받습니다. 영업일 1~2일 내 회신드립니다.',
    keywords: ['학원 프로그램 도입', 'EduFlow 문의', '학원 관리 프로그램 상담'],
  },
  faq: {
    path: MARKETING_ROUTES.faq,
    title: '자주 묻는 질문 — 학원 관리 프로그램 FAQ',
    description:
      '엑셀 이전, 기존 ERP 병행, AI 데이터 사용, 학부모 포털, 무료 체험 등 EduFlow에 대해 자주 묻는 질문과 답변입니다.',
    keywords: ['학원 프로그램 FAQ', '학원 관리 질문'],
  },
  privacy: {
    path: MARKETING_ROUTES.privacy,
    title: '개인정보처리방침',
    description:
      'EduFlow(eduflowclass.com) 개인정보 수집·이용·보관·파기 및 이용자 권리 안내.',
    keywords: ['개인정보처리방침', 'EduFlow 개인정보'],
  },
  terms: {
    path: MARKETING_ROUTES.terms,
    title: '이용약관',
    description:
      'EduFlow 서비스 이용약관. 회원 가입, 서비스 이용, 요금, 데이터 소유권 안내.',
    keywords: ['이용약관', 'EduFlow 약관'],
  },
  academyManagement: {
    path: MARKETING_ROUTES.academyManagement,
    title: '학원 관리 프로그램 — 수업·출결·상담을 하나로',
    description:
      '출결, 숙제, 성적, 상담, 학부모 소통까지 학원 운영에 필요한 기록을 하나의 프로그램에서 관리하세요. 엑셀과 여러 도구에 흩어진 학원 관리를 EduFlow가 연결합니다.',
    keywords: ['학원 관리 프로그램', '학원 운영 프로그램', '학원 관리 시스템', '학원 ERP'],
  },
  academyConsulting: {
    path: MARKETING_ROUTES.academyConsulting,
    title: '학원 상담 프로그램 — 상담 기록·학부모 상담 관리',
    description:
      '학생 상담 기록, 상담일지 작성, 학부모 상담 준비를 체계적으로 관리하세요. 수업 기록이 상담 준비가 되고, 상담 결과가 학부모에게 전달되는 흐름을 만듭니다.',
    keywords: ['학원 상담 프로그램', '학원 상담 관리', '학생 상담 기록', '학원 상담일지', '학부모 상담'],
  },
  studentManagement: {
    path: MARKETING_ROUTES.studentManagement,
    title: '학원 학생 관리 프로그램 — 기록·분석·상담 연결',
    description:
      '학생별 출결, 성적, 숙제, 상담 이력을 한곳에서 확인하고 관리가 필요한 학생을 놓치지 마세요. 학생 기록이 쌓일수록 상담과 운영이 정확해집니다.',
    keywords: ['학원 학생 관리 프로그램', '학생 관리 시스템', '학원 학생 관리', '학원 CRM'],
  },
  retention: {
    path: MARKETING_ROUTES.retention,
    title: '학원 재등록 관리 — 퇴원 전에 상담으로 지키세요',
    description:
      '학생 이탈 신호를 수업·상담 기록에서 미리 확인하고, 재등록 시즌 전에 상담 대상을 선정하세요. 단순 수납 관리가 아닌, 상담과 연결된 재등록 관리 방법을 안내합니다.',
    keywords: ['학원 재등록 관리', '학원 재등록률', '학원 퇴원율', '학생 이탈 관리', '학원 재등록'],
  },
  blog: {
    path: MARKETING_ROUTES.blog,
    title: '학원 운영 블로그 — 상담·학생 관리·재등록 노하우',
    description:
      '학원 상담일지 작성법, 학부모 상담 관리, 재등록률 높이는 방법, 학원 CRM 활용법 등 학원 운영에 필요한 실전 가이드를 제공합니다.',
    keywords: ['학원 운영 블로그', '학원 상담 가이드', '학원 관리 팁', '학원 재등록 노하우'],
  },
};

/** 리다이렉트 전용 경로 — 검색 색인 제외 */
export const REDIRECT_PAGE_SEO = {
  demo: {
    path: MARKETING_ROUTES.demo,
    title: '데모 체험 — 학원 관리 화면 미리보기',
    description: 'EduFlow 데모 계정으로 대시보드, 학생 관리, 상담 준비 화면을 직접 체험해 보세요.',
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

const SHARED_OG_IMAGE = {
  url: SITE_OG_IMAGE,
  width: SITE_OG_IMAGE_WIDTH,
  height: SITE_OG_IMAGE_HEIGHT,
  alt: SITE_OG_IMAGE_ALT,
};

/** 아이콘·manifest·OG 이미지 — 루트·페이지 메타 공통 */
export const SHARED_SITE_METADATA: Pick<
  Metadata,
  'icons' | 'manifest' | 'openGraph' | 'twitter'
> = {
  icons: {
    icon: [{ url: SITE_FAVICON, sizes: '48x48', type: 'image/x-icon' }],
    apple: [{ url: SITE_APPLE_TOUCH_ICON, sizes: '180x180', type: 'image/png' }],
  },
  manifest: SITE_MANIFEST,
  openGraph: {
    images: [SHARED_OG_IMAGE],
  },
  twitter: {
    images: [SITE_OG_IMAGE],
  },
};

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
      images: [SHARED_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [SITE_OG_IMAGE],
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
  ...SHARED_SITE_METADATA,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: MARKETING_PAGE_SEO.home.description,
    images: [SHARED_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: MARKETING_PAGE_SEO.home.description,
    images: [SITE_OG_IMAGE],
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

export const ERROR_PAGE_SEO = {
  notFound: {
    path: '/404',
    title: '페이지를 찾을 수 없습니다',
    description: `요청하신 페이지가 없거나 주소가 변경되었습니다. ${BRAND_NAME} 홈으로 이동하거나 도입 문의를 이용해 주세요.`,
    noIndex: true,
  },
  serverError: {
    path: '/500',
    title: '일시적인 오류가 발생했습니다',
    description: `잠시 후 다시 시도해 주세요. 문제가 계속되면 ${CONTACT_EMAIL} 로 문의해 주세요.`,
    noIndex: true,
  },
} as const satisfies Record<string, PageSeoConfig>;
