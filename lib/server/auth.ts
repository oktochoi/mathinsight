import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { resolveUserRoleState } from '@/lib/resolveUserRole';
import type { UserProfile } from '@/types/database';

function mapDbRole(raw: string | null | undefined): UserProfile['role'] {
  if (raw === 'admin') return 'owner';
  if (raw === 'teacher' || raw === 'parent' || raw === 'student' || raw === 'owner') {
    return raw;
  }
  return 'owner';
}

/** 서버 컴포넌트용 세션·프로필 (역할 자동 복구 포함) */
export async function getServerAuthProfile(): Promise<{
  userId: string | null;
  profile: UserProfile | null;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const state = await resolveUserRoleState(supabase, user, { syncMetadata: false });
  if (state.profile) {
    return { userId: user.id, profile: state.profile };
  }

  return {
    userId: user.id,
    profile: {
      id: user.id,
      email: user.email ?? '',
      name: (user.user_metadata?.name as string | undefined) ?? user.email ?? '',
      role: mapDbRole(state.rawDbRole),
      academy_id: null,
      created_at: user.created_at ?? new Date().toISOString(),
    },
  };
}
