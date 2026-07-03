import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

export function LandingTrialBanner() {
  return (
    <section id="trial" className="corp-trial-banner scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="corp-trial-inner">
          <div className="corp-trial-visual">
            <div className="corp-trial-avatar">
              <i className="ri-user-smile-line" aria-hidden />
            </div>
            <div className="corp-trial-badge">
              <span>운영 컨설턴트</span>
              <strong>1:1 도입 지원</strong>
            </div>
          </div>
          <div className="corp-trial-copy">
            <p className="corp-trial-lead">
              {PROMO_ALL_FREE.active ? (
                <>
                  {BRAND_NAME} <strong>행사 기간 — 모든 플랜 무료</strong>
                </>
              ) : (
                <>
                  {BRAND_NAME}를 <strong>1개월 무료</strong>로 체험해 보세요!
                </>
              )}
            </p>
            <p className="corp-trial-sub">
              {PROMO_ALL_FREE.active
                ? PROMO_ALL_FREE.subtitle
                : '수업·출결·상담 데이터를 연결한 뒤, 재등록 상담 흐름이 어떻게 바뀌는지 직접 확인하세요.'}
            </p>
          </div>
          <Link href="/signup" className="corp-trial-cta">
            <span>{PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '무료 체험'}</span>
            <span>신청하기</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
