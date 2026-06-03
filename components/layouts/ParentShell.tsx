'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isStaffProfile } from '@/lib/profileIntegrity';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

export default function ParentShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50/80 via-slate-50 to-slate-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-violet-100/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-violet-600 flex items-center justify-center">
              <i className="ri-parent-line text-white text-sm"></i>
            </div>
            <span className="font-bold text-slate-900 text-sm truncate">EduFlow</span>
            <span className="text-[10px] text-violet-600 font-medium uppercase border-l border-violet-100 pl-2 ml-0.5 hidden sm:inline shrink-0">
              학부모 포털
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-sm text-slate-600 truncate max-w-[100px] sm:max-w-[160px] hidden min-[400px]:inline">
              {profile?.name}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer"
              aria-label="메뉴"
            >
              <i className={cn('text-lg', menuOpen ? 'ri-close-line' : 'ri-more-2-fill')}></i>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:block text-xs text-slate-500 hover:text-slate-800 cursor-pointer px-2 py-2 min-h-[40px]"
            >
              로그아웃
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-100 px-4 py-3 bg-white space-y-2">
            <p className="text-sm font-medium text-slate-800">{profile?.name}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left text-sm text-red-600 py-2 cursor-pointer min-h-[44px]"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full min-w-0">{children}</main>
    </div>
  );
}
