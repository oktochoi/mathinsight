import { BrandLogoImage } from '@/components/brand/BrandLogo';

export function LandingCustomerCenter() {
  return (
    <section id="support" className="corp-support scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="corp-support-inner">
          <div className="corp-support-brand">
            <span className="corp-support-logo" aria-hidden>
              <BrandLogoImage size={52} />
            </span>
            <div>
              <p className="corp-support-label">EduFlow 고객센터</p>
              <p className="corp-support-hours">평일 09:00 – 18:00 · 점심 12:00 – 13:00</p>
            </div>
          </div>
          <div className="corp-support-contact">
            <a href="mailto:support@eduflow.app" className="corp-support-link">
              <i className="ri-mail-line" aria-hidden />
              support@eduflow.app
            </a>
            <a href="tel:1588-0000" className="corp-support-phone">
              1588-0000
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
