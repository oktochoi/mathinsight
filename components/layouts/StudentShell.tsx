'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isStaffProfile } from '@/lib/profileIntegrity';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { useEffect } from 'react';

const NAV = [
  { href: '#today', label: '오늘', icon: 'ri-calendar-check-line' },
  { href: '#learn', label: '학습 흐름', icon: 'ri-line-chart-line' },
  { href: '#schedule', label: '일정', icon: 'ri-calendar-line' },
  { href: '#feedback', label: '피드백', icon: 'ri-chat-3-line' },
  { href: '#history', label: '수업 기록', icon: 'ri-history-line' },
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
              ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-800 transition-colors'
              : 'student-nav-pill shrink-0 gap-1.5'
          )}
        >
          <i className={cn(item.icon, vertical && 'text-lg text-sky-600')} aria-hidden />
          {item.label}
        </a>
      ))}
    </>
  );
}

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isStaffProfile(profile)) {
      router.replace('/dashboard');
    }
  }, [loading, profile, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <div className="student-portal min-h-dvh">
      <div className="lg:flex lg:min-h-dvh">
        <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 shrink-0 border-r border-sky-100 bg-white/70 backdrop-blur-sm sticky top-0 h-dvh">
          <div className="p-6 border-b border-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
                <i className="ri-graduation-cap-line text-white text-xl" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900">학생 포털</p>
                {profile?.name && (
                  <p className="text-xs text-slate-500 truncate">{profile.name}</p>
                )}
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              메뉴
            </p>
            <NavLinks vertical />
          </nav>
          <div className="p-4 border-t border-sky-50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            >
              로그아웃
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="student-portal-header sticky top-0 z-50 lg:hidden">
            <div className="px-4 sm:px-5">
              <div className="h-14 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
                    <i className="ri-graduation-cap-line text-white text-lg" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">학생 포털</p>
                    {profile?.name && (
                      <p className="text-xs text-slate-500">{profile.name}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-slate-600 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
              <nav className="flex gap-1 pb-3 overflow-x-auto scrollbar-none">
                <NavLinks />
              </nav>
            </div>
          </header>

          <main className="student-portal-main flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10 pb-16 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
