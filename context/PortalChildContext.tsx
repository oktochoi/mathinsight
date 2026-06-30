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
import { fetchParentLinkedStudents } from '@/lib/portalStudents';
import type { Student } from '@/types/database';

const STORAGE_KEY = 'parent-selected-child';

type PortalChildContextValue = {
  children: Student[];
  child: Student | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => Promise<Student[]>;
};

const PortalChildContext = createContext<PortalChildContextValue | null>(null);

function pickDefaultChild(students: Student[]): string {
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return sorted[0]?.id ?? '';
}

export function PortalChildProvider({ children: node }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedId, setSelectedIdState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profile?.id) {
      setChildren([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);
    const { students, error: err } = await fetchParentLinkedStudents(profile.id);
    if (err) {
      setError('자녀 정보를 불러오지 못했습니다.');
      setChildren([]);
    } else {
      const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      setChildren(sorted);
    }
    setLoading(false);
    return err ? [] : students;
  }, [profile?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (children.length === 0) {
      setSelectedIdState('');
      return;
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const next =
      stored && children.some((c) => c.id === stored) ? stored : pickDefaultChild(children);
    setSelectedIdState(next);
  }, [children]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const child = useMemo(
    () => children.find((c) => c.id === selectedId) ?? null,
    [children, selectedId]
  );

  const value = useMemo(
    () => ({ children, child, selectedId, setSelectedId, loading, error, reload }),
    [children, child, selectedId, setSelectedId, loading, error, reload]
  );

  return <PortalChildContext.Provider value={value}>{node}</PortalChildContext.Provider>;
}

export function usePortalChild() {
  const ctx = useContext(PortalChildContext);
  if (!ctx) {
    throw new Error('usePortalChild must be used within PortalChildProvider');
  }
  return ctx;
}
