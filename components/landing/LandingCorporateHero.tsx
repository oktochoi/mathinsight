import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { BrandLogoImage } from '@/components/brand/BrandLogo';

export function LandingCorporateHero() {
  return (
    <section id="hero" className="corp-hero scroll-mt-16">
      <div className="corp-hero-inner max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="corp-hero-grid">
          <div className="corp-hero-copy">
            <p className="corp-hero-eyebrow">2026 학원 운영 혁신 캠페인</p>
            <h1 className="corp-hero-title">
              수업 기록이 연결되면
              <br />
              <span className="corp-hero-highlight">재등록 상담</span>이 달라집니다
            </h1>
            <p className="corp-hero-desc">
              {BRAND_NAME}는 Lesson 중심 운영 OS입니다.
              <br className="hidden sm:block" />
              출결·숙제·점수·상담을 하나의 흐름으로 묶어 학부모 신뢰를 지킵니다.
            </p>
            <div className="corp-hero-actions">
              <Link href="/signup" className="corp-btn-orange">
                무료로 시작하기
              </Link>
              <Link href="/auth" className="corp-btn-outline">
                데모 계정 로그인
              </Link>
            </div>
            <p className="corp-hero-note">
              <i className="ri-shield-check-line" aria-hidden />
              설치 없이 웹에서 바로 사용 · 학원 데이터는 암호화 저장
            </p>
          </div>

          <div className="corp-hero-visual" aria-hidden>
            <div className="corp-hero-badge-float corp-float-1">
              <i className="ri-calendar-check-line" />
              <span>오늘 수업 마감</span>
            </div>
            <div className="corp-hero-badge-float corp-float-2">
              <i className="ri-parent-line" />
              <span>학부모 AI 문서</span>
            </div>
            <div className="corp-hero-illust">
              <div className="corp-illust-main">
                <BrandLogoImage size={80} className="opacity-95" />
              </div>
              <div className="corp-illust-orbit corp-orbit-a">
                <i className="ri-book-open-line" />
              </div>
              <div className="corp-illust-orbit corp-orbit-b">
                <i className="ri-chat-heart-line" />
              </div>
              <div className="corp-illust-orbit corp-orbit-c">
                <i className="ri-bar-chart-grouped-line" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
