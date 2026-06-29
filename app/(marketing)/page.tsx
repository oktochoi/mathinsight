import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/brand';
import { HomePageContent } from '@/components/marketing/pages/HomePageContent';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — 원장이 매일 쓰는 학원 운영 시스템`,
  description: '오늘 수업부터 출결·숙제·상담 준비, 학부모 리포트, 재등록 관리까지.',
};

export default function HomePage() {
  return <HomePageContent />;
}
