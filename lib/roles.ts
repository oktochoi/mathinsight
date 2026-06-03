import type { UserProfile } from '@/types/database';

/** 앱·UI 역할 */
export type UserRole = 'owner' | 'teacher' | 'parent' | 'student';

/** Supabase `users.role` 컬럼 값 (레거시: admin = 학원 원장) */
export type DbUserRole = 'admin' | 'teacher' | 'parent' | 'student';

/** 가입 시 선택 가능한 역할 (teacher는 학원에서 초대) */
export type SignupRole = 'owner' | 'parent' | 'student';

export function toDbRole(role: UserRole | SignupRole | string): DbUserRole {
  if (role === 'owner' || role === 'admin') return 'admin';
  if (role === 'teacher' || role === 'parent' || role === 'student') return role;
  return 'parent';
}

export function fromDbRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  if (role === 'admin') return 'owner';
  if (role === 'teacher' || role === 'parent' || role === 'student') return role;
  return null;
}

export function isStaffRole(role: string | null | undefined): boolean {
  const app = fromDbRole(role);
  return app === 'owner' || app === 'teacher';
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
