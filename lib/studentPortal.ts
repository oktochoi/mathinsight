import type { Student } from '@/types/database';

export function studentParentEmail(s: Student): string {
  return s.parent_invite_email?.trim() || '';
}

export function studentPortalEmail(s: Student): string {
  return s.student_invite_email?.trim() || '';
}

export function isParentLinked(s: Student): boolean {
  return !!s.parent_user_id;
}

export function isStudentPortalLinked(s: Student): boolean {
  return !!s.student_user_id;
}
