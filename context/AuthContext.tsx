'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile } from '@/lib/auth';
import type { Academy, UserProfile } from '@/types/database';

interface AuthState {
  profile: UserProfile | null;
  academy: Academy | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setAcademy(null);
      setLoading(false);
      return;
    }
    const p = await fetchUserProfile(user.id);
    setProfile(p);
    if (p?.academy_id) {
      const { data } = await supabase
        .from('academies')
        .select('*')
        .eq('id', p.academy_id)
        .maybeSingle();
      setAcademy((data as Academy) ?? null);
    } else {
      setAcademy(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const value = useMemo(
    () => ({ profile, academy, loading, error, refresh: load }),
    [profile, academy, loading, error, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
