/** Permission keys — 서버·클라이언트 공용 (훅 없음) */

export type PermissionKey =
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.withdraw'
  | 'lessons.view'
  | 'lessons.manage'
  | 'counseling.view'
  | 'counseling.manage'
  | 'retention.view'
  | 'retention.manage'
  | 'parent_comms.view'
  | 'parent_comms.send'
  | 'billing.view'
  | 'billing.manage'
  | 'schedule.view'
  | 'schedule.manage'
  | 'analytics.view'
  | 'settings.academy'
  | 'settings.staff'
  | 'settings.permissions'
  | 'scope.all_students';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'students.view',
  'students.create',
  'students.edit',
  'students.withdraw',
  'lessons.view',
  'lessons.manage',
  'counseling.view',
  'counseling.manage',
  'retention.view',
  'retention.manage',
  'parent_comms.view',
  'parent_comms.send',
  'billing.view',
  'billing.manage',
  'schedule.view',
  'schedule.manage',
  'analytics.view',
  'settings.academy',
  'settings.staff',
  'settings.permissions',
  'scope.all_students',
];

export const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,

  teacher: [
    'students.view',
    'lessons.view',
    'lessons.manage',
    'counseling.view',
    'counseling.manage',
    'parent_comms.view',
    'parent_comms.send',
    'schedule.view',
  ],

  desk: [
    'students.view',
    'students.create',
    'students.edit',
    'students.withdraw',
    'counseling.view',
    'counseling.manage',
    'retention.view',
    'retention.manage',
    'parent_comms.view',
    'parent_comms.send',
    'billing.view',
    'billing.manage',
    'schedule.view',
    'schedule.manage',
  ],

  parent: [],
  student: [],
};

export function computePermissions(
  role: string | null | undefined,
  overrides: { permission_key: string; granted: boolean }[]
): Set<PermissionKey> {
  const base = new Set<PermissionKey>(
    DEFAULT_PERMISSIONS[role === 'owner' ? 'owner' : (role ?? '')] ?? []
  );
  for (const o of overrides) {
    const key = o.permission_key as PermissionKey;
    if (o.granted) base.add(key);
    else base.delete(key);
  }
  return base;
}
