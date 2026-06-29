import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export function LandingContact() {
  return (
    <section id="contact" className="ef-section ef-section-cta scroll-mt-20">
      <div className="ef-container">
        <div className="ef-contact-card">
          <div className="ef-contact-copy">
            <p className="ef-eyebrow ef-eyebrow-light">Contact</p>
            <h2 className="ef-contact-title">도입·데모·Enterprise 문의</h2>
            <p className="ef-contact-desc">
              {BRAND_NAME}가 우리 학원 상담 운영에 맞는지 함께 확인해 드립니다.
              데모 계정 안내와 온보딩 일정도 요청하실 수 있습니다.
            </p>
            <div className="ef-contact-meta">
              <a href="mailto:hello@eduflow.app" className="ef-contact-link">
                <i className="ri-mail-line" aria-hidden />
                hello@eduflow.app
              </a>
            </div>
          </div>

          <form className="ef-contact-form" action="mailto:hello@eduflow.app" method="post">
            <label className="ef-field">
              <span>이름</span>
              <input type="text" name="name" placeholder="홍길동" required />
            </label>
            <label className="ef-field">
              <span>이메일</span>
              <input type="email" name="email" placeholder="you@academy.kr" required />
            </label>
            <label className="ef-field">
              <span>학원명</span>
              <input type="text" name="academy" placeholder="OO수학학원" />
            </label>
            <label className="ef-field ef-field-full">
              <span>문의 내용</span>
              <textarea name="message" rows={4} placeholder="도입 규모, 현재 사용 중인 도구 등" required />
            </label>
            <button type="submit" className="ef-btn-primary ef-btn-light w-full">
              문의하기
            </button>
            <p className="ef-contact-note">
              또는{' '}
              <Link href="/signup" className="ef-link-light">
                무료 체험
              </Link>
              으로 바로 시작하세요.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
