'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { fetchActiveWorkspaces } from '@/lib/workspace/memberships';
import { workspaceLabel, type WorkspaceMembership } from '@/lib/workspace/types';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export function ChooseWorkspaceClient() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  const selectAndRedirect = async (membershipId: string): Promise<string> => {
    const res = await fetch('/api/workspace/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId }),
    });
    const data = (await res.json()) as { ok?: boolean; path?: string; error?: string };
    if (!res.ok || !data.ok || !data.path) {
      throw new Error(data.error ?? '워크스페이스 선택에 실패했습니다.');
    }
    return data.path;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const rows = await fetchActiveWorkspaces(supabase, user.id);
      if (cancelled) return;
      if (rows.length <= 1) {
        if (rows.length === 1) {
          const path = await selectAndRedirect(rows[0].id);
          router.replace(path);
        } else {
          router.replace('/onboarding');
        }
        return;
      }
      setMemberships(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectAndRedirect is stable
  }, [router]);

  const handleSelect = async (id: string) => {
    setSelecting(id);
    try {
      const path = await selectAndRedirect(id);
      toast.success('워크스페이스가 선택되었습니다.');
      router.replace(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '선택에 실패했습니다.');
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <AuthPageScaffold>
        <AuthFormCard title="워크스페이스 선택" subtitle="불러오는 중...">
          <p className="py-8 text-center text-sm" style={{ color: 'var(--auth-muted)' }}>
            잠시만 기다려 주세요
          </p>
        </AuthFormCard>
      </AuthPageScaffold>
    );
  }

  return (
    <AuthPageScaffold>
      <AuthFormCard title="어디로 들어갈까요?" subtitle="학원과 역할을 선택하세요">
        <ul className="space-y-2">
          {memberships.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={selecting !== null}
                onClick={() => handleSelect(m.id)}
                className="w-full text-left rounded-xl px-4 py-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{
                  background: 'var(--auth-surface-2)',
                  border: '1px solid var(--auth-border)',
                  color: 'var(--auth-ink)',
                }}
              >
                <span className="text-sm font-semibold">{workspaceLabel(m)}</span>
                {selecting === m.id && (
                  <span className="block text-xs mt-1" style={{ color: 'var(--auth-muted)' }}>
                    이동 중...
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
