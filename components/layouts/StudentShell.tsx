'use client';

import { StudentBottomTabBar } from '@/components/portal/StudentBottomTabBar';
import { StudentNavLinks } from '@/components/portal/StudentNavLinks';
import { StudentChatFab } from '@/components/chat/StudentChatFab';
import { PushInAppBanner } from '@/components/PushInAppBanner';
import { StudentPortalProvider } from '@/context/StudentPortalContext';
import { useAuth } from '@/context/AuthContext';
import { isStaffProfile } from '@/lib/profileIntegrity';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentShell({ children }: { children: React.ReactNode }) {
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
    <StudentPortalProvider>
      <div className="student-portal min-h-dvh">
        <PushInAppBanner />
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
              <StudentNavLinks vertical />
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
            <header className="student-portal-header sticky top-0 z-50 lg:hidden mobile-top-safe">
              <div className="px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
                    <i className="ri-graduation-cap-line text-white text-lg" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">학생 포털</p>
                    {profile?.name && (
                      <p className="text-xs text-slate-500 truncate">{profile.name}</p>
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
            </header>

            <main className="student-portal-main flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10 pb-24 lg:pb-10">
              {children}
            </main>
          </div>
        </div>
        <StudentBottomTabBar />
        <StudentChatFab />
      </div>
    </StudentPortalProvider>
  );
}
