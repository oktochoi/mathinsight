'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TopNav() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { profile, academy } = useAuth();
  const router = useRouter();

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header
      className="h-16 bg-white/80 backdrop-blur-xl border-b flex items-center justify-between px-8 sticky top-0 z-40"
      style={{ borderColor: 'rgba(226,232,240,0.6)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <i className="ri-building-line text-blue-500 text-xs"></i>
          <span className="text-slate-700 font-semibold text-sm">{academy?.name ?? '학원'}</span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <i className="ri-calendar-line text-slate-400 text-sm"></i>
          <span suppressHydrationWarning>
            {dateStr} <span className="text-slate-400">({weekday})</span>
          </span>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
            {profile?.name?.charAt(0) ?? '?'}
          </div>
          <div className="hidden md:block text-left">
            <span className="text-sm text-slate-700 font-semibold block">{profile?.name}</span>
            <span className="text-[10px] text-blue-500 font-medium block">{profile?.role}</span>
          </div>
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-14 w-52 rounded-xl shadow-xl py-2 z-50 bg-white border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">{profile?.name}</p>
              <p className="text-xs text-slate-400">{profile?.email}</p>
            </div>
            <Link
              href="/settings"
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setShowDropdown(false)}
            >
              설정
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
