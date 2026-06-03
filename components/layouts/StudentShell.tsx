'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-sky-50/80 via-slate-50 to-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sky-100/80 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-sky-600 flex items-center justify-center">
              <i className="ri-graduation-cap-line text-white text-sm"></i>
            </div>
            <span className="font-bold text-slate-900 text-sm truncate">EduFlow</span>
            <span className="text-[10px] text-sky-600 font-medium uppercase border-l border-sky-100 pl-2 hidden sm:inline shrink-0">
              학생 포털
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-600 truncate max-w-[120px] hidden sm:inline">
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
          <div className="sm:hidden border-t px-4 py-3 bg-white">
            <p className="text-sm font-medium mb-2">{profile?.name}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-red-600 py-2 cursor-pointer min-h-[44px]"
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
