'use client';

import { useMemo } from 'react';

type ClassMember = {
  id: string;
  class_id: string | null;
  name?: string;
  grade?: string;
};

/** 반 소속 학생 ID — students refetch 시에도 ID 목록이 같으면 안정적인 키 유지 */
export function useClassStudentIds<T extends ClassMember>(students: T[], classId: string) {
  const studentIdsKey = useMemo(
    () =>
      students
        .filter((s) => s.class_id === classId)
        .map((s) => s.id)
        .sort()
        .join(','),
    [students, classId]
  );

  const studentIds = useMemo(
    () => (studentIdsKey ? studentIdsKey.split(',') : []),
    [studentIdsKey]
  );

  const classStudents = useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId]
  ) as T[];

  return { studentIds, studentIdsKey, classStudents };
}
