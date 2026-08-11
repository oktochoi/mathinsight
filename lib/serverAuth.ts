import type { SupabaseClient } from '@supabase/supabase-js';
import { computePermissions, type PermissionKey } from '@/lib/permissionKeys';
import { requireStaff, type StaffAuthResult } from '@/lib/api/staffAuth';
import { STAFF_NAV_SECTIONS } from '@/lib/staffNavigation';

export type PermissionAuthResult =
  | (Extract<StaffAuthResult, { ok: true }> & { permissions: Set<PermissionKey> })
  | Extract<StaffAuthResult, { ok: false }>;

/** path → required permission (사이드바 IA와 동일) */
export function getRequiredPermissionForPath(pathname: string): PermissionKey | null {
  const path = pathname.split('?')[0];
  let best: { len: number; key: PermissionKey } | null = null;

  for (const section of STAFF_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.hidden || !item.requiredPermissions?.length) continue;
      const prefix = item.href.split('?')[0];
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        if (!best || prefix.length > best.len) {
          best = { len: prefix.length, key: item.requiredPermissions[0] as PermissionKey };
        }
      }
    }
  }

  // 사이드바에 없는 연관 경로
  if (path.startsWith('/integrations')) return 'settings.academy';
  if (path.startsWith('/student-growth')) return 'counseling.view';

  return best?.key ?? null;
}

export async function loadStaffPermissions(
  supabase: SupabaseClient,
  userId: string,
  academyId: string,
  role: string
): Promise<Set<PermissionKey>> {
  const { data } = await supabase
    .from('staff_permission_overrides')
    .select('permission_key, granted')
    .eq('user_id', userId)
    .eq('academy_id', academyId);

  return computePermissions(
    role,
    (data ?? []) as { permission_key: string; granted: boolean }[]
  );
}

export async function requirePermission(
  supabase: SupabaseClient,
  permission: PermissionKey
): Promise<PermissionAuthResult> {
  const auth = await requireStaff(supabase);
  if (!auth.ok) return auth;

  const permissions = await loadStaffPermissions(
    supabase,
    auth.userId,
    auth.academyId,
    auth.role
  );

  if (!permissions.has(permission)) {
    return { ok: false, status: 403, error: '이 기능을 사용할 권한이 없습니다.' };
  }

  return { ...auth, permissions };
}

export async function staffHasPermission(
  supabase: SupabaseClient,
  userId: string,
  academyId: string,
  role: string,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await loadStaffPermissions(supabase, userId, academyId, role);
  return permissions.has(permission);
}
