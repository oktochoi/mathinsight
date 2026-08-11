'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { QuickActionsMenu } from '@/components/navigation/QuickActionsMenu';
import { useAiUsage } from '@/hooks/useAiUsage';

type TopNavProps = {
  onMenuOpen?: () => void;
};

export default function TopNav({ onMenuOpen }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { profile, academy } = useAuth();
  const router = useRouter();
  const { used, quota, loading: aiLoading } = useAiUsage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const roleLabel =
    profile?.role === 'owner'
      ? '원장'
      : profile?.role === 'teacher'
        ? '선생님'
        : profile?.role === 'desk'
          ? '원무'
          : '';

  return (
    <header
      className="h-12 sm:h-14 sticky top-0 z-30 shrink-0 flex items-center gap-3 px-4 sm:px-6 lg:px-8"
      style={{
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onMenuOpen}
          className="lg:hidden w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors cursor-pointer app-btn-ghost"
          aria-label="메뉴 열기"
        >
          <i className="ri-menu-line text-base" style={{ color: 'var(--app-ink-2)' }} />
        </button>

        {academy?.name && (
          <span
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium max-w-[140px]"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border-md)',
              color: 'var(--app-ink-2)',
            }}
          >
            <i className="ri-building-line text-[10px] shrink-0" style={{ color: 'var(--app-ink-3)' }} />
            <span className="truncate">{academy.name}</span>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {!aiLoading && quota > 0 && (
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium tabular-nums"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border-md)',
              color: used >= quota ? 'var(--app-danger, #b91c1c)' : 'var(--app-ink-2)',
            }}
            title="이번 달 AI 사용량"
          >
            <i className="ri-sparkling-line text-[10px]" />
            AI {used}/{quota}
          </span>
        )}

        <QuickActionsMenu />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer')}
            style={{
              background: showDropdown ? 'var(--app-surface)' : 'transparent',
              border: `1px solid ${showDropdown ? 'var(--app-border-md)' : 'transparent'}`,
            }}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'var(--app-accent)' }}
            >
              {profile?.name?.charAt(0) ?? '?'}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold block" style={{ color: 'var(--app-ink)' }}>
                {profile?.name}
              </span>
              {roleLabel && (
                <span className="text-[10px] block" style={{ color: 'var(--app-ink-3)' }}>
                  {roleLabel}
                </span>
              )}
            </div>
            <i
              className={cn(
                'ri-arrow-down-s-line text-sm hidden sm:block transition-transform',
                showDropdown && 'rotate-180'
              )}
              style={{ color: 'var(--app-ink-3)' }}
            />
          </button>

          {showDropdown && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="닫기"
                onClick={() => setShowDropdown(false)}
              />
              <div
                className="absolute right-0 top-full mt-1.5 w-52 max-w-[calc(100vw-2rem)] rounded-xl py-1.5 z-50"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border-md)',
                  boxShadow: 'var(--s-lg)',
                }}
              >
                <div
                  className="px-3.5 py-2.5 mx-1.5 rounded-lg mb-1"
                  style={{ background: 'var(--app-surface-2)' }}
                >
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                    {profile?.name}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    {profile?.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium mx-1 rounded-lg transition-colors"
                  style={{ color: 'var(--app-ink-2)' }}
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="ri-settings-3-line text-sm" style={{ color: 'var(--app-ink-3)' }} />
                  설정
                </Link>
                <div className="h-px mx-3 my-1" style={{ background: 'var(--app-border)' }} />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-left mx-1 rounded-lg transition-colors cursor-pointer app-text-danger"
                >
                  <i className="ri-logout-box-line text-sm" />
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
