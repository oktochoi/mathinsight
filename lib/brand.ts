/** EduFlow 브랜드 (앱 전역 단일 출처) */

export const BRAND_NAME = 'EduFlow';
export const BRAND_SLUG = 'eduflow';

export const BRAND_TAGLINE =
  '재등록을 지키는 AI 상담 인프라';

export const BRAND_TAGLINE_SHORT = 'AI 상담 · 재등록 방어';

export const BRAND_DESCRIPTION =
  '수업·숙제·상담 기록을 하나의 흐름으로 연결해 학원 운영과 학부모 소통을 돕는 교육 AI 워크플로우 플랫폼';

export const BRAND_META_TITLE = `${BRAND_NAME} — 학생 흐름 기반 교육 운영`;

/** 공식 사이트 · 검색엔진·OG canonical */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://eduflowclass.com'
).replace(/\/$/, '');

/** 도입·법무·고객 문의 */
export const CONTACT_EMAIL = 'okto0914@gmail.com';

export const COMPANY_LEGAL_NAME = '(주)에듀플로우';
export const COMPANY_SERVICE_NAME = 'EduFlow';
export const COMPANY_DOMAIN = 'eduflowclass.com';
