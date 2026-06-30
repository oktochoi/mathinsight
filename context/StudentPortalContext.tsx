'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentSelfProfile } from '@/lib/portalStudents';
import type { Student } from '@/types/database';

type StudentPortalContextValue = {
  student: Student | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<Student | null>;
};

const StudentPortalContext = createContext<StudentPortalContextValue | null>(null);

export function StudentPortalProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profile?.id) {
      setStudent(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    const { student: row, error: err } = await fetchStudentSelfProfile(profile.id);
    if (err) {
      setError('학생 정보를 불러오지 못했습니다.');
      setStudent(null);
    } else {
      setStudent(row);
    }
    setLoading(false);
    return row;
  }, [profile?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ student, loading, error, reload }),
    [student, loading, error, reload]
  );

  return <StudentPortalContext.Provider value={value}>{children}</StudentPortalContext.Provider>;
}

export function useStudentPortal() {
  const ctx = useContext(StudentPortalContext);
  if (!ctx) {
    throw new Error('useStudentPortal must be used within StudentPortalProvider');
  }
  return ctx;
}
