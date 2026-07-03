/** 행사 기간 — 모든 플랜 무료 프로모션 (UI·구독 게이트 공통) */
export const PROMO_ALL_FREE = {
  active: true,
  badge: '행사 기간 한정',
  title: '지금은 모든 플랜 무료',
  subtitle: '행사 기간 중 요금 청구 없이 전 기능을 이용하실 수 있습니다.',
  priceLabel: '무료',
  periodSuffix: '',
  footnote: '행사 기간 한정 · 카드 등록 없이 시작',
  cta: '무료로 시작하기',
  faqAnswer:
    '현재 행사 기간으로 Starter·성장·프로 등 모든 플랜을 무료로 이용하실 수 있습니다. 카드 등록 없이 가입 후 바로 시작하세요.',
} as const;

export function displayPlanPrice(regularPrice: number | string): string {
  if (PROMO_ALL_FREE.active) return PROMO_ALL_FREE.priceLabel;
  if (typeof regularPrice === 'string') return regularPrice;
  return regularPrice.toLocaleString('ko-KR');
}

export function showPlanCurrency(regularPrice: number | string): boolean {
  if (PROMO_ALL_FREE.active) return false;
  return regularPrice !== '문의';
}
