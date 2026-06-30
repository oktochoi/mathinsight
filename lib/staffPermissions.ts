import { supabase } from '@/lib/supabase';
import type { PermissionKey } from '@/lib/permissions';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: '로그인이 필요합니다.',
  owner_only: '원장만 직원 권한을 변경할 수 있습니다.',
  no_academy: '학원이 연결되지 않았습니다.',
  cannot_edit_self: '본인 권한은 이 화면에서 변경할 수 없습니다.',
  staff_not_found: '직원을 찾을 수 없습니다.',
  invalid_target: '권한을 변경할 수 없는 계정입니다.',
  invalid_role: '올바르지 않은 역할입니다.',
  cannot_change_owner: '원장 계정의 역할은 변경할 수 없습니다.',
};

function mapRpcError(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return ERROR_MESSAGES[code] ?? fallback;
}

export async function setStaffPermissionOverride(
  userId: string,
  permissionKey: PermissionKey,
  granted: boolean | null
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc('set_staff_permission_override', {
    p_user_id: userId,
    p_permission_key: permissionKey,
    p_granted: granted,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    return { error: mapRpcError(result?.error, '권한 저장에 실패했습니다.') };
  }

  return { error: null };
}

export async function updateStaffMemberRole(
  userId: string,
  role: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc('update_staff_member_role', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    return { error: mapRpcError(result?.error, '역할 저장에 실패했습니다.') };
  }

  return { error: null };
}
