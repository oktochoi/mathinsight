'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// ── Permission Key 목록 ────────────────────────────────────────────
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
  | 'analytics.view'
  | 'settings.academy'
  | 'settings.staff'
  | 'settings.permissions'
  | 'scope.all_students';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'students.view', 'students.create', 'students.edit', 'students.withdraw',
  'lessons.view', 'lessons.manage',
  'counseling.view', 'counseling.manage',
  'retention.view', 'retention.manage',
  'parent_comms.view', 'parent_comms.send',
  'billing.view', 'billing.manage',
  'analytics.view',
  'settings.academy', 'settings.staff', 'settings.permissions',
  'scope.all_students',
];

// ── 역할별 기본 권한 ──────────────────────────────────────────────
export const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,

  teacher: [
    'students.view',
    'lessons.view', 'lessons.manage',
    'counseling.view', 'counseling.manage',
    'parent_comms.view', 'parent_comms.send',
  ],

  desk: [
    'students.view', 'students.create', 'students.edit', 'students.withdraw',
    'counseling.view', 'counseling.manage',
    'retention.view', 'retention.manage',
    'parent_comms.view', 'parent_comms.send',
    'billing.view', 'billing.manage',
  ],

  parent: [],
  student: [],
};

// ── 순수 함수: 역할 + 오버라이드로 권한 확인 ─────────────────────
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

// ── React 훅 ──────────────────────────────────────────────────────
export function useStaffPermissions() {
  const { profile } = useAuth();
  const role = (profile?.role as string) ?? null;
  const [overrides, setOverrides] = useState<{ permission_key: string; granted: boolean }[]>([]);

  useEffect(() => {
    if (!profile?.id || !profile?.academy_id) {
      setOverrides([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('staff_permission_overrides')
        .select('permission_key, granted')
        .eq('user_id', profile.id)
        .eq('academy_id', profile.academy_id);
      setOverrides((data ?? []) as { permission_key: string; granted: boolean }[]);
    })();
  }, [profile?.id, profile?.academy_id]);

  const permSet = computePermissions(role, overrides);
  const can = (key: PermissionKey): boolean => permSet.has(key);

  return { can, role };
}
