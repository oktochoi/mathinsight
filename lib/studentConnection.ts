import type { ConnectionRelationship, UserProfile } from '@/types/database';

export const RELATIONSHIP_LABELS: Record<ConnectionRelationship, string> = {
  mother: '어머니',
  father: '아버지',
  guardian: '보호자',
  student: '학생 본인',
};

export const PARENT_RELATIONSHIPS: ConnectionRelationship[] = [
  'mother',
  'father',
  'guardian',
];

export function normalizeConnectionCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidConnectionCodeFormat(code: string): boolean {
  return /^EDU-[A-Z0-9]{4}-\d{2}$/.test(normalizeConnectionCode(code));
}

export function connectionRequestErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'invalid_code':
      return '학원 연결 코드를 찾을 수 없습니다. 코드를 다시 확인해 주세요.';
    case 'student_name_required':
      return '연결할 학생 이름을 입력해 주세요.';
    case 'student_required':
      return '승인할 학생을 선택해 주세요.';
    case 'invalid_student':
      return '선택한 학생을 확인할 수 없습니다.';
    case 'student_role_required':
      return '학생 계정으로 로그인한 뒤 시도해 주세요.';
    case 'parent_role_required':
      return '학부모 계정으로 로그인한 뒤 시도해 주세요.';
    case 'already_connected':
      return '이미 연결된 학생입니다.';
    case 'relationship_taken':
      return '해당 관계는 이미 다른 계정에 연결되어 있습니다.';
    case 'pending_exists':
      return '이미 승인 대기 중인 요청이 있습니다.';
    case 'not_authenticated':
      return '로그인이 필요합니다.';
    default:
      return '연결 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

export function canSubmitRelationship(
  profileRole: UserProfile['role'] | undefined,
  relationship: ConnectionRelationship
): boolean {
  if (relationship === 'student') return profileRole === 'student';
  return profileRole === 'parent';
}
