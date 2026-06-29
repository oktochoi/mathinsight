import { redirect } from 'next/navigation';

/** 연동 메뉴는 설정으로 통합 — 기존 URL 호환 */
export default function IntegrationsRedirectPage() {
  redirect('/settings?tab=integrations');
}
