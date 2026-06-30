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
import { getClientSiteOrigin, getConfiguredSiteOrigin } from '@/lib/siteUrl';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { repairProfileRole } from '@/lib/profileIntegrity';
import { resolveUserRoleState } from '@/lib/resolveUserRole';
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
  // desk/teacher는 초대로만 가입 → parent로 fallback (기존 동작 유지)

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
  _emailHint?: string
): Promise<{ profile: UserProfile | null; needsChooseRole: boolean; rawDbRole: string | null }> {
  const state = await resolveUserRoleState(supabase, user, { syncMetadata: true });
  return {
    profile: state.profile,
    needsChooseRole: state.needsChooseRole,
    rawDbRole: state.rawDbRole,
  };
}

/** 이메일 가입 — 회원가입 시 역할을 바로 설정, DB 트리거가 users row 생성 */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  name: string;
  role: SignupRole;
  phone?: string;
}): Promise<SignUpResult> {
  const origin = getClientSiteOrigin();
  const emailRedirectTo = `${origin}/auth/callback`;

  const dbRole = params.role === 'owner' ? 'admin' : params.role;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name.trim(),
        role: dbRole,
        profile_setup: PROFILE_SETUP_COMPLETE,
        ...(params.phone ? { phone: params.phone } : {}),
      },
      emailRedirectTo,
    },
  });

  if (authError) return { error: formatAuthError(authError) };

  if (!authData.user?.id) return { error: '회원가입에 실패했습니다.' };

  if (params.phone && authData.session) {
    await supabase.from('users').update({ phone: params.phone }).eq('id', authData.user.id);
  }

  const hasSession = !!authData.session;
  const needsEmailConfirmation = !hasSession && !!authData.user;

  return {
    error: null,
    hasSession,
    needsEmailConfirmation,
  };
}

/** @deprecated signUpWithEmail 사용 */
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
    role: params.role,
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
    role: 'owner',
  });
}

export async function signInWithLoginId(
  loginId: string,
  password: string
): Promise<{
  error: string | null;
  profile: UserProfile | null;
  user: User | null;
  needsChooseRole?: boolean;
  rawDbRole?: string | null;
}> {
  const { resolveLoginEmail } = await import('@/lib/phone');
  return signInWithRole(resolveLoginEmail(loginId), password);
}

/** @deprecated signInWithLoginId 사용 */
export async function signInWithPhone(
  phone: string,
  password: string
): Promise<{
  error: string | null;
  profile: UserProfile | null;
  user: User | null;
  needsChooseRole?: boolean;
  rawDbRole?: string | null;
}> {
  const { phoneToAuthEmail } = await import('@/lib/phone');
  return signInWithRole(phoneToAuthEmail(phone), password);
}

export async function signInWithRole(
  email: string,
  password: string
): Promise<{
  error: string | null;
  profile: UserProfile | null;
  user: User | null;
  needsChooseRole?: boolean;
  rawDbRole?: string | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: formatAuthError(error), profile: null, user: null };

  const { profile, needsChooseRole, rawDbRole } = await resolveProfileAfterAuth(data.user, email);

  if (needsChooseRole) {
    return { error: null, profile, user: data.user, needsChooseRole: true, rawDbRole };
  }

  const resolvedProfile = profile ?? (await fetchUserProfile(data.user.id));

  return {
    error: null,
    profile: resolvedProfile,
    user: data.user,
    needsChooseRole: false,
    rawDbRole: rawDbRole as string | null,
  };
}

/** 비밀번호 재설정 메일 발송 */
export async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  const origin = getClientSiteOrigin();
  const redirectTo = `${origin}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error ? formatAuthError(error) : null };
}

/** 로그인 상태에서 새 비밀번호 저장 (재설정 링크 직후) */
export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error ? formatAuthError(error) : null };
}

/** 서버·문서용 프로덕션 사이트 origin */
export function getAuthEmailRedirectOrigin(): string {
  return getConfiguredSiteOrigin() ?? getClientSiteOrigin();
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
