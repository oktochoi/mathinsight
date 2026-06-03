import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fromDbRole, isStaffRole, normalizeUserProfile, toDbRole } from '@/lib/roles';
import { PROFILE_SETUP_COMPLETE, PROFILE_SETUP_PENDING } from '@/lib/authProfileSetup';
import type { UserProfile } from '@/types/database';

type RepairOptions = {
  /** false면 DB만 수정 (미들웨어용) */
  syncAuthMetadata?: boolean;
};

async function syncOwnerAuthMetadata(
  client: SupabaseClient,
  academyId: string | null
): Promise<void> {
  await client.auth.updateUser({
    data: {
      profile_setup: PROFILE_SETUP_COMPLETE,
      role: 'owner',
      academy_name: null,
    },
  });
}

/**
 * academies.owner_id 인데 users.role 이 parent/student 인 경우 → admin(원장)으로 복구
 */
async function repairAcademyOwnerProfile(
  userId: string,
  profile: UserProfile,
  client: SupabaseClient,
  options: RepairOptions
): Promise<UserProfile> {
  const { data: owned } = await client
    .from('academies')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!owned?.id) return profile;

  const alreadyOwner = profile.role === 'owner' && profile.academy_id === owned.id;
  if (alreadyOwner) return profile;

  const { error } = await client
    .from('users')
    .update({
      role: toDbRole('owner'),
      academy_id: owned.id,
    })
    .eq('id', userId);

  if (error) return profile;

  if (options.syncAuthMetadata !== false) {
    await syncOwnerAuthMetadata(client, owned.id);
  }

  return normalizeUserProfile({
    ...profile,
    role: 'owner',
    academy_id: owned.id,
  });
}

/** 역할 선택 완료(metadata owner)인데 DB만 parent 인 경우 */
async function repairMetadataOwnerProfile(
  userId: string,
  profile: UserProfile,
  metadata: Record<string, unknown> | undefined,
  client: SupabaseClient,
  options: RepairOptions
): Promise<UserProfile> {
  if (profile.role === 'owner' || profile.role === 'teacher') return profile;

  const setup = metadata?.profile_setup;
  const intended = fromDbRole(metadata?.role as string | undefined);
  if (intended !== 'owner') return profile;
  if (setup !== PROFILE_SETUP_COMPLETE && setup !== PROFILE_SETUP_PENDING) {
    return profile;
  }

  const { data: owned } = await client
    .from('academies')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  const academyId = owned?.id ?? profile.academy_id;

  const { error } = await client
    .from('users')
    .update({
      role: toDbRole('owner'),
      academy_id: academyId,
    })
    .eq('id', userId);

  if (error) return profile;

  if (options.syncAuthMetadata !== false) {
    await syncOwnerAuthMetadata(client, academyId);
  }

  return normalizeUserProfile({
    ...profile,
    role: 'owner',
    academy_id: academyId,
  });
}

/** 프로필 조회 직후 역할 불일치 복구 (로그인·미들웨어·OAuth 공통) */
export async function repairProfileRole(
  userId: string,
  profile: UserProfile | null,
  metadata?: Record<string, unknown>,
  client: SupabaseClient = supabase,
  options: RepairOptions = {}
): Promise<UserProfile | null> {
  if (!profile) return null;
  let p = await repairAcademyOwnerProfile(userId, profile, client, options);
  p = await repairMetadataOwnerProfile(userId, p, metadata, client, options);
  return p;
}

/** 역할에 맞지 않는 URL 접근 방지용 홈 경로 */
export function homePathForProfile(profile: UserProfile | null | undefined): string {
  if (!profile?.role) return '/auth/choose-role';
  if (profile.role === 'parent') return '/parent';
  if (profile.role === 'student') return '/student';
  return '/dashboard';
}

export function isStaffProfile(profile: UserProfile | null | undefined): boolean {
  return isStaffRole(profile?.role);
}

export function isParentProfile(profile: UserProfile | null | undefined): boolean {
  return profile?.role === 'parent';
}

export function isStudentProfile(profile: UserProfile | null | undefined): boolean {
  return profile?.role === 'student';
}

/** DB admin 문자열이 normalize 전에 들어온 경우 */
export function normalizeDbRoleField(role: string | null | undefined): UserProfile['role'] {
  return fromDbRole(role) ?? 'parent';
}
