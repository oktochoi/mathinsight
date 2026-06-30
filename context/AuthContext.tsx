'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import { resolveProfileAfterAuth } from '@/lib/auth';
import type { Academy, UserProfile } from '@/types/database';

interface AuthState {
  profile: UserProfile | null;
  academy: Academy | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef(initialProfile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const load = useCallback(async () => {
    setError(null);
    if (!profileRef.current) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setAcademy(null);
      setLoading(false);
      return;
    }
    const { profile: p, needsChooseRole } = await resolveProfileAfterAuth(user);
    setProfile(p);
    if (!p && needsChooseRole) {
      setError('역할·학원 설정이 필요합니다. 잠시 후 역할 선택 화면으로 이동합니다.');
    } else if (!p) {
      setError('프로필을 불러오지 못했습니다. 다시 로그인하거나 역할 선택을 완료해 주세요.');
    }
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
    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // metadata 동기화·토큰 갱신마다 load() → updateUser 연쇄 → 429 방지
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        return;
      }
      void load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (!profile?.id) return;

    window.onFcmToken = async (token: string) => {
      if (!token?.trim()) return;
      await supabase.from('push_tokens').upsert(
        {
          user_id: profile.id,
          token: token.trim(),
          platform: 'flutter',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    };

    window.onPushMessage = (title: string, body: string) => {
      window.dispatchEvent(
        new CustomEvent('eduflow:push', { detail: { title, body } })
      );
    };

    return () => {
      delete window.onFcmToken;
      delete window.onPushMessage;
    };
  }, [profile?.id]);

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
