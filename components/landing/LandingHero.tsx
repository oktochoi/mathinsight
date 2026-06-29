import Link from 'next/link';
import { LandingHeroMockup } from '@/components/landing/LandingHeroMockup';

export function LandingHero() {
  return (
    <section className="ef-hero">
      <div className="ef-container ef-hero-grid">
        <div className="ef-hero-copy">
          <p className="ef-eyebrow">AI Counseling Operating System</p>
          <h1 className="ef-hero-title">
            학생 기록이
            <br />
            <span className="ef-text-gradient">AI 상담</span>이 됩니다.
          </h1>
          <p className="ef-hero-desc">
            수업기록부터 AI 학생 분석, 상담 준비, 학부모 리포트, 재등록 관리까지
            하나의 Workflow로 연결합니다.
          </p>
          <div className="ef-hero-actions">
            <Link href="/signup" className="ef-btn-primary">
              무료 체험하기
            </Link>
            <Link href="/auth" className="ef-btn-secondary">
              데모 체험
            </Link>
          </div>
          <p className="ef-hero-trust">
            <i className="ri-shield-check-line" aria-hidden />
            학원 ERP가 아닌, 상담 준비가 자동화되는 AI 운영 시스템
          </p>
        </div>

        <LandingHeroMockup />
      </div>
    </section>
  );
}
