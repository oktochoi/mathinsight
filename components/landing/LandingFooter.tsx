import Link from 'next/link';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';

export function LandingFooter() {
  return (
    <footer className="ef-footer">
      <div className="ef-container ef-footer-inner">
        <div className="ef-footer-brand">
          <Link href="/" className="ef-logo ef-logo-footer">
            <span className="ef-logo-mark" aria-hidden>
              <i className="ri-flow-chart" />
            </span>
            <span>{BRAND_NAME}</span>
          </Link>
          <p className="ef-footer-tagline">{BRAND_TAGLINE}</p>
          <p className="ef-footer-sub">AI Counseling Operating System</p>
        </div>

        <div className="ef-footer-links">
          <div>
            <p className="ef-footer-label">Product</p>
            <a href="#features">기능</a>
            <a href="#workflow">Workflow</a>
            <a href="#screens">화면</a>
          </div>
          <div>
            <p className="ef-footer-label">Plan</p>
            <a href="#pricing">요금</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">문의</a>
          </div>
          <div>
            <p className="ef-footer-label">Account</p>
            <Link href="/auth">로그인</Link>
            <Link href="/signup">무료 체험</Link>
            <Link href="/parent">학부모 포털</Link>
          </div>
        </div>
      </div>

      <div className="ef-container ef-footer-bottom">
        <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
        <span>학원 ERP가 아닌, AI 상담 운영 시스템</span>
      </div>
    </footer>
  );
}
