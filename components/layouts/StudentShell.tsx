'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <i className="ri-bar-chart-box-fill text-white text-sm"></i>
            </div>
            <span className="font-bold text-slate-800 text-sm">MathInsight</span>
            <span className="text-[10px] text-slate-400 uppercase border-l pl-2">학생 포털</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{profile?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-slate-500 cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
