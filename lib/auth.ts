import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureProfile';
import { pendingSignupMetadata } from '@/lib/completeProfileSetup';
import {
  hasAssignedDbRole,
  PROFILE_SETUP_COMPLETE,
  shouldSyncMetadataFromProfile,
  syncAuthMetadataFromProfile,
} from '@/lib/authProfileSetup';
import {
  fromDbRole,
  normalizeUserProfile,
  roleHomePath,
  type SignupRole,
  type UserRole,
} from '@/lib/roles';
import { getClientSiteOrigin } from '@/lib/siteUrl';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { repairProfileRole } from '@/lib/profileIntegrity';
import type { UserProfile } from '@/types/database';
import type { AuthError, User } from '@supabase/supabase-js';

export { needsProfileSetup } from '@/lib/authProfileSetup';
export { completeProfileSetup } from '@/lib/completeProfileSetup';
export { roleHomePath, type SignupRole, type UserRole } from '@/lib/roles';

export type SignUpResult = {
  error: string | null;
  role?: UserRole;
  hasSession?: boolean;
  needsEmailConfirmation?: boolean;
};

/** Auth API 오류를 사용자용 한국어 메시지로 변환 */
export function formatAuthError(error: AuthError | { message?: string; status?: number }): string {
  const msg = error.message ?? '';
  const status = 'status' in error ? error.status : undefined;

  if (
    status === 429 ||
    msg.includes('429') ||
    /too many requests/i.test(msg) ||
    /rate limit/i.test(msg)
  ) {
    return (
      '가입 요청이 너무 많습니다. 1~2분 뒤 다시 시도해 주세요. ' +
      '이미 가입한 이메일이면 로그인을 이용해 주세요.'
    );
  }

  if (/already registered|already been registered|user already exists/i.test(msg)) {
    return '이미 가입된 이메일입니다. 로그인해 주세요.';
  }

  if (/email not confirmed/i.test(msg)) {
    return '이메일 인증이 필요합니다. 받은 메일의 링크를 눌러 주세요.';
  }

  if (/invalid login credentials/i.test(msg)) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  if (status === 401 || /jwt|not authorized|unauthorized/i.test(msg)) {
    return (
      '인증에 실패했습니다. Supabase SQL에 002_auth_user_trigger.sql을 실행했는지 확인해 주세요. ' +
      '이미 가입된 이메일이면 로그인을 시도해 주세요.'
    );
  }

  return msg || '인증 요청에 실패했습니다.';
}

/** OAuth 콜백·로그인 URL의 ?error= 코드 → 한국어 메시지 */
export function oauthLoginErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'role_owner':
    case 'role_admin':
      return '원장(학원 운영) 계정으로 이용해 주세요.';
    case 'role_teacher':
      return '강사 계정으로 이용해 주세요.';
    case 'role_parent':
      return '학부모 계정으로 이용해 주세요.';
    case 'role_student':
      return '학생 계정으로 이용해 주세요.';
    case 'oauth_missing':
      return 'Google 로그인 정보가 부족합니다. 다시 시도해 주세요.';
    case 'oauth_exchange':
      return 'Google 로그인 세션을 만들지 못했습니다. Supabase Redirect URL을 확인해 주세요.';
    case 'profile':
      return '프로필을 만들지 못했습니다. Supabase SQL 002·005를 실행했는지 확인해 주세요.';
    default:
      if (code.length > 80) return 'Google 로그인에 실패했습니다. 다시 시도해 주세요.';
      return decodeURIComponent(code.replace(/\+/g, ' '));
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const origin = getClientSiteOrigin();
  const redirectTo = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  });

  return { error: error ? formatAuthError(error) : null };
}

/** 레거시·OAuth: DB 프로필은 있는데 metadata가 어긋난 경우 동기화 */
export async function reconcileProfileSetup(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return;

  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!data) return;

  const rawDbRole = data.role as string;
  let profile = normalizeUserProfile(data as UserProfile);
  profile = (await repairProfileRole(userId, profile, user.user_metadata)) ?? profile;

  if (!shouldSyncMetadataFromProfile(user, profile, rawDbRole)) return;

  const displayName =
    profile.name ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '사용자';

  if (rawDbRole) {
    await syncAuthMetadataFromProfile(profile, displayName, rawDbRole);
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;

  const rawDbRole = data.role as string;
  let profile = normalizeUserProfile(data as UserProfile);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.id === userId ? user.user_metadata : undefined;
  profile = (await repairProfileRole(userId, profile, meta)) ?? profile;

  if (user && profile && rawDbRole && shouldSyncMetadataFromProfile(user, profile, rawDbRole)) {
    const displayName =
      profile.name ||
      (user.user_metadata?.name as string | undefined)?.trim() ||
      user.email?.split('@')[0] ||
      '사용자';
    await syncAuthMetadataFromProfile(profile, displayName, rawDbRole);
    await supabase.auth.refreshSession();
  }

  return profile;
}

/** 이메일 레거시 가입(metadata에 role·학원명) — DB 프로필 없을 때 복구 */
async function bootstrapProfileFromMetadata(
  user: User,
  email: string
): Promise<UserProfile | null> {
  const rawRole = user.user_metadata?.role as string | undefined;
  if (!rawRole) return null;

  const appRole = fromDbRole(rawRole);
  if (!appRole) return null;
  const signupRole: SignupRole =
    appRole === 'owner' || appRole === 'parent' || appRole === 'student' ? appRole : 'parent';

  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '사용자';
  const academyName = (user.user_metadata?.academy_name as string | undefined)?.trim();

  if (signupRole === 'owner' && !academyName) {
    return null;
  }

  await supabase.auth.updateUser({
    data: {
      profile_setup: PROFILE_SETUP_COMPLETE,
      name,
      role: signupRole,
      academy_name: signupRole === 'owner' ? academyName : null,
    },
  });

  const { profile } = await ensureUserProfile(user.id, {
    email: user.email ?? email,
    name,
    role: signupRole,
    academyName: signupRole === 'owner' ? academyName : undefined,
  });
  return profile;
}

/** 로그인·세션 직후 프로필 확보 */
export async function resolveProfileAfterAuth(
  user: User,
  emailHint?: string
): Promise<{ profile: UserProfile | null; needsChooseRole: boolean }> {
  let profile = await fetchUserProfile(user.id);

  const {
    data: { user: refreshed },
  } = await supabase.auth.getUser();
  const activeUser = refreshed ?? user;

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const rawDbRole = (roleRow?.role as string | undefined) ?? null;

  if (!hasAssignedDbRole(rawDbRole)) {
    return { profile, needsChooseRole: true };
  }

  if (profile) {
    return { profile, needsChooseRole: false };
  }

  return { profile: null, needsChooseRole: true };
}

/** 이메일 가입 — 역할은 /auth/choose-role 에서 선택 */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  name: string;
}): Promise<SignUpResult> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: pendingSignupMetadata(params.name),
    },
  });

  if (authError) return { error: formatAuthError(authError) };

  if (!authData.user?.id) return { error: '회원가입에 실패했습니다.' };

  const hasSession = !!authData.session;
  const needsEmailConfirmation = !hasSession && !!authData.user;

  return {
    error: null,
    hasSession,
    needsEmailConfirmation,
  };
}

/** @deprecated signUpWithEmail + choose-role 사용 */
export async function signUpWithRole(params: {
  email: string;
  password: string;
  name: string;
  role: SignupRole;
  academyName?: string;
}): Promise<SignUpResult> {
  return signUpWithEmail({
    email: params.email,
    password: params.password,
    name: params.name,
  });
}

/** @deprecated signUpWithEmail 사용 */
export async function signUpAcademyOwner(params: {
  email: string;
  password: string;
  name: string;
  academyName: string;
}): Promise<SignUpResult> {
  return signUpWithEmail({
    email: params.email,
    password: params.password,
    name: params.name,
  });
}

export async function signInWithRole(
  email: string,
  password: string
): Promise<{
  error: string | null;
  profile: UserProfile | null;
  user: User | null;
  needsChooseRole?: boolean;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: formatAuthError(error), profile: null, user: null };

  const { profile, needsChooseRole } = await resolveProfileAfterAuth(data.user, email);

  if (needsChooseRole) {
    return { error: null, profile: null, user: data.user, needsChooseRole: true };
  }

  if (!profile) {
    return {
      error:
        '프로필을 불러오지 못했습니다. 역할 선택(/auth/choose-role)에서 다시 설정해 주세요.',
      profile: null,
      user: data.user,
    };
  }

  return { error: null, profile, user: data.user };
}

/** 로그인·OAuth 직후 이동 경로 (상대 경로) */
export function postAuthPath(
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null
): string {
  return postAuthDestination(user, profile, rawDbRole);
}

export { resolvePostLoginPath } from '@/lib/authRedirect';
