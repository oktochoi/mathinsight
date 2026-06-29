'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isStaffProfile } from '@/lib/profileIntegrity';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '#overview', label: '학습 요약', icon: 'ri-file-list-3-line' },
  { href: '#erp', label: '출결·숙제', icon: 'ri-task-line' },
  { href: '#notices', label: '공지', icon: 'ri-megaphone-line' },
  { href: '#inquiry', label: '문의', icon: 'ri-mail-send-line' },
  { href: '#ask', label: 'AI 질문', icon: 'ri-chat-3-line' },
  { href: '#details', label: '점수·일정', icon: 'ri-line-chart-line' },
  { href: '#reports', label: '안내문', icon: 'ri-mail-line' },
] as const;

function NavLinks({ vertical }: { vertical?: boolean }) {
  return (
    <>
      {NAV.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            vertical
              ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors'
              : 'parent-nav-pill shrink-0 gap-1.5'
          )}
        >
          <i className={cn(item.icon, vertical && 'text-lg text-indigo-500')} aria-hidden />
          {item.label}
        </a>
      ))}
    </>
  );
}

export default function ParentShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (profile?.onboarding_complete === false) {
      router.replace('/onboarding');
      return;
    }
    if (isStaffProfile(profile)) {
      router.replace('/dashboard');
    }
  }, [loading, profile, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="parent-portal min-h-dvh">
      <div className="lg:flex lg:min-h-dvh">
        {/* PC: 왼쪽 사이드바 */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 shrink-0 border-r border-stone-200/80 bg-white/70 backdrop-blur-sm sticky top-0 h-dvh">
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <i className="ri-parent-line text-white text-xl" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-stone-900">학부모 포털</p>
                {profile?.name && (
                  <p className="text-xs text-stone-500 truncate">{profile.name}님</p>
                )}
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 mb-2">
              메뉴
            </p>
            <NavLinks vertical />
          </nav>
          <div className="p-4 border-t border-stone-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left text-sm text-stone-600 hover:text-stone-900 px-3 py-2.5 rounded-xl hover:bg-stone-100 cursor-pointer transition-colors"
            >
              로그아웃
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* 모바일: 상단 헤더 */}
          <header className="parent-portal-header sticky top-0 z-50 lg:hidden">
            <div className="px-4 sm:px-5">
              <div className="h-14 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <i className="ri-parent-line text-white text-lg" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 text-sm">학부모 포털</p>
                    {profile?.name && (
                      <p className="text-xs text-stone-500 truncate">{profile.name}님</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-stone-600 px-3 py-2 rounded-lg border border-stone-200 cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
              <nav className="flex gap-1 pb-3 overflow-x-auto scrollbar-none">
                <NavLinks />
              </nav>
            </div>
          </header>

          <main className="parent-portal-main flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10 pb-16 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
