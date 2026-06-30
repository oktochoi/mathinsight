import type {
  ConnectionRelationship,
  Student,
  StudentConnection,
  StudentConnectionRequest,
} from '@/types/database';
import { RELATIONSHIP_LABELS } from '@/lib/studentConnection';

export function formatConnectionStatus(
  connections: StudentConnection[],
  pendingCount: number
): {
  parentLines: string[];
  studentLine: string | null;
  pendingLabel: string | null;
} {
  const parentLines = connections
    .filter((c) => c.relationship !== 'student')
    .map((c) => {
      const label = RELATIONSHIP_LABELS[c.relationship as ConnectionRelationship];
      const name = c.user?.name ?? c.user?.email ?? '연결됨';
      return `✓ ${label} (${name})`;
    });

  const self = connections.find((c) => c.relationship === 'student');
  const studentLine = self
    ? `✓ ${RELATIONSHIP_LABELS.student}${self.user?.name ? ` (${self.user.name})` : ''}`
    : null;

  const pendingLabel =
    pendingCount > 0 ? `연결 요청 중 ${pendingCount}건` : null;

  return { parentLines, studentLine, pendingLabel };
}

export function studentParentEmail(s: Student): string {
  return s.parent_invite_email?.trim() ?? '';
}

export function studentPortalEmail(s: Student): string {
  return s.student_invite_email?.trim() ?? '';
}

export function isParentLinked(
  student: Student,
  connections?: Pick<StudentConnection, 'relationship'>[]
): boolean {
  if (connections?.length) {
    return connections.some((c) => c.relationship !== 'student');
  }
  return false;
}

export function isStudentPortalLinked(
  student: Student,
  connections?: Pick<StudentConnection, 'relationship'>[]
): boolean {
  if (connections?.length) {
    return connections.some((c) => c.relationship === 'student');
  }
  return false;
}

export type ConnectionBundle = {
  connections: StudentConnection[];
  pendingRequests: StudentConnectionRequest[];
};
