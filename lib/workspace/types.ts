export type WorkspaceMembership = {
  id: string;
  academy_id: string;
  role: string;
  status: string;
  academy_name: string;
};

export const WORKSPACE_COOKIE = 'eduflow_workspace_id';

export function workspaceLabel(m: WorkspaceMembership): string {
  const roleLabels: Record<string, string> = {
    owner: '원장',
    teacher: '강사',
    desk: '원무',
    parent: '학부모',
    student: '학생',
  };
  return `${m.academy_name} · ${roleLabels[m.role] ?? m.role}`;
}

export function homeForMembershipRole(role: string): string {
  if (role === 'parent') return '/parent';
  if (role === 'student') return '/student';
  return '/dashboard';
}
