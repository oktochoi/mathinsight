import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceMembership } from '@/lib/workspace/types';

export async function fetchActiveWorkspaces(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceMembership[]> {
  const { data, error } = await supabase
    .from('academy_memberships')
    .select('id, academy_id, role, status, academies(name)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !data) return [];

  return data.map((row) => {
    const academyJoin = row.academies as { name: string } | { name: string }[] | null;
    const academyName = Array.isArray(academyJoin) ? academyJoin[0]?.name : academyJoin?.name;
    return {
      id: row.id as string,
      academy_id: row.academy_id as string,
      role: row.role as string,
      status: row.status as string,
      academy_name: academyName ?? '학원',
    };
  });
}

export async function applyWorkspaceContext(
  supabase: SupabaseClient,
  userId: string,
  membership: WorkspaceMembership
): Promise<{ error: string | null }> {
  const dbRole =
    membership.role === 'owner'
      ? 'admin'
      : membership.role === 'desk'
        ? 'desk'
        : membership.role;

  const { error } = await supabase
    .from('users')
    .update({
      academy_id: membership.academy_id,
      role: dbRole,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}
