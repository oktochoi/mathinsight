import type { WorkspaceMembership } from '@/lib/workspace/types';
import { homeForMembershipRole } from '@/lib/workspace/types';

/** 활성 워크스페이스 1개면 홈, 2개 이상이면 선택 페이지 */
export function resolveWorkspaceDestination(
  memberships: WorkspaceMembership[],
  chooseWorkspacePath = '/choose-workspace'
): string | { choose: true; path: string } {
  const active = memberships.filter((m) => m.status === 'active');
  if (active.length === 0) {
    return '/onboarding';
  }
  if (active.length === 1) {
    return homeForMembershipRole(active[0].role);
  }
  return { choose: true, path: chooseWorkspacePath };
}
