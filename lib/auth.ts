import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureProfile';
import type { UserProfile, UserRole } from '@/types/database';
import type { AuthError } from '@supabase/supabase-js';

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

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
    default:
      return '/dashboard';
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserProfile;
}

async function waitForProfile(userId: string, attempts = 8): Promise<UserProfile | null> {
  for (let i = 0; i < attempts; i++) {
    const profile = await fetchUserProfile(userId);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}

export type SignupRole = 'admin' | 'parent' | 'student';

/**
 * 프로필·학원 생성은 DB 트리거(handle_new_user)가 담당합니다.
 * supabase/migrations/002_auth_user_trigger.sql 필수 실행.
 */
export async function signUpWithRole(params: {
  email: string;
  password: string;
  name: string;
  role: SignupRole;
  academyName?: string;
}): Promise<SignUpResult> {
  if (params.role === 'admin' && !params.academyName?.trim()) {
    return { error: '학원 이름을 입력해 주세요.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name,
        role: params.role,
        academy_name: params.role === 'admin' ? params.academyName?.trim() : null,
      },
    },
  });

  if (authError) return { error: formatAuthError(authError) };

  const userId = authData.user?.id;
  if (!userId) return { error: '회원가입에 실패했습니다.' };

  const hasSession = !!authData.session;
  const needsEmailConfirmation = !hasSession && !!authData.user;

  if (hasSession) {
    let profile = await waitForProfile(userId);
    if (!profile) {
      const ensured = await ensureUserProfile(userId, {
        email: params.email,
        name: params.name,
        role: params.role,
        academyName: params.academyName,
      });
      profile = ensured.profile;
      if (!profile) {
        return {
          error:
            ensured.error ??
            '프로필을 자동으로 만들지 못했습니다. 로그인을 시도해 보세요. 계속되면 Supabase에서 005_ensure_user_profile_rpc.sql을 실행해 주세요.',
          role: params.role,
          hasSession: true,
        };
      }
    }
  }

  return {
    error: null,
    role: params.role,
    hasSession,
    needsEmailConfirmation,
  };
}

/** @deprecated signUpWithRole 사용 — 트리거가 학원까지 생성 */
export async function signUpAcademyOwner(params: {
  email: string;
  password: string;
  name: string;
  academyName: string;
}): Promise<SignUpResult> {
  return signUpWithRole({
    ...params,
    role: 'admin',
    academyName: params.academyName,
  });
}

export async function signInWithRole(
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<{ error: string | null; profile: UserProfile | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: formatAuthError(error), profile: null };

  let profile = await fetchUserProfile(data.user.id);
  if (!profile) {
    const role = (data.user.user_metadata?.role as SignupRole) || 'parent';
    const ensured = await ensureUserProfile(data.user.id, {
      email: data.user.email ?? email,
      name: (data.user.user_metadata?.name as string) || data.user.email?.split('@')[0] || '',
      role,
      academyName: data.user.user_metadata?.academy_name as string | undefined,
    });
    profile = ensured.profile;
    if (!profile) {
      return {
        error:
          ensured.error ??
          '프로필이 없습니다. Supabase SQL Editor에서 002·005를 실행하거나 004로 기존 계정을 복구해 주세요.',
        profile: null,
      };
    }
  }

  if (expectedRole && profile.role !== expectedRole) {
    await supabase.auth.signOut();
    const roleLabel =
      expectedRole === 'parent' ? '학부모' : expectedRole === 'student' ? '학생' : '원장/강사';
    return { error: `${roleLabel} 계정으로 로그인해 주세요.`, profile: null };
  }

  return { error: null, profile };
}
