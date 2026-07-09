import { getConfiguredSiteOrigin } from '@/lib/siteUrl';

export function getStudentInviteUrl(loginCode: string): string {
  const code = loginCode.replace(/-/g, '').toUpperCase();
  return `${getConfiguredSiteOrigin()}/student-invite/${encodeURIComponent(code)}`;
}

export function getEmailInviteUrl(token: string): string {
  return `${getConfiguredSiteOrigin()}/invite/${encodeURIComponent(token)}`;
}

export function getStudentLoginUrl(): string {
  return `${getConfiguredSiteOrigin()}/login/student`;
}
