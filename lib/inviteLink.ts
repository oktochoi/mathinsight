import { getClientSiteOrigin } from '@/lib/siteUrl';

export function getJoinInviteUrl(academyCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : getClientSiteOrigin();
  return `${origin}/join/${encodeURIComponent(academyCode.toUpperCase())}`;
}
