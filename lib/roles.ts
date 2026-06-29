import type { UserProfile } from '@/types/database';

/** 앱·UI 역할 */
export type UserRole = 'owner' | 'teacher' | 'desk' | 'parent' | 'student';

/** Supabase `users.role` 컬럼 값 (admin = 원장, desk = 원무) */
export type DbUserRole = 'admin' | 'teacher' | 'desk' | 'parent' | 'student';

/** 가입 시 선택 가능한 역할 */
export type SignupRole = 'owner' | 'teacher' | 'parent' | 'student';

export function toDbRole(role: UserRole | SignupRole | string): DbUserRole {
  if (role === 'owner' || role === 'admin') return 'admin';
  if (role === 'teacher' || role === 'desk' || role === 'parent' || role === 'student') return role;
  return 'parent';
}

export function fromDbRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  if (role === 'admin') return 'owner';
  if (role === 'teacher' || role === 'desk' || role === 'parent' || role === 'student') return role;
  return null;
}

export function isStaffRole(role: string | null | undefined): boolean {
  const app = fromDbRole(role);
  return app === 'owner' || app === 'teacher' || app === 'desk';
}

export function roleHomePath(role: string | null | undefined): string {
  const app = fromDbRole(role);
  if (!app) return '/auth/choose-role';
  switch (app) {
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
    default:
      return '/dashboard';
  }
}

export function normalizeUserProfile<T extends UserProfile>(row: T): T {
  const role = fromDbRole(row.role as string) ?? 'parent';
  return {
    ...row,
    role: role as T['role'],
  };
}
