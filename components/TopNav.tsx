'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

type TopNavProps = {
  onMenuOpen?: () => void;
};

export default function TopNav({ onMenuOpen }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { profile, academy } = useAuth();
  const router = useRouter();

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <header
      className="h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0"
      style={{ borderColor: 'rgba(226,232,240,0.6)' }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuOpen}
          className="lg:hidden w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
          aria-label="메뉴 열기"
        >
          <i className="ri-menu-line text-lg"></i>
        </button>
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full min-w-0 max-w-[140px] md:max-w-none"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <i className="ri-building-line text-blue-500 text-xs shrink-0"></i>
          <span className="text-slate-700 font-semibold text-sm truncate">
            {academy?.name ?? '학원'}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden md:block shrink-0"></div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm min-w-0">
          <i className="ri-calendar-line text-slate-400 text-sm shrink-0"></i>
          <span suppressHydrationWarning className="truncate">
            <span className="hidden sm:inline">{dateStr} </span>
            <span className="text-slate-400">({weekday})</span>
          </span>
        </div>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 py-1 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer min-h-[40px]"
          aria-expanded={showDropdown}
          aria-haspopup="true"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile?.name?.charAt(0) ?? '?'}
          </div>
          <div className="hidden md:block text-left max-w-[120px]">
            <span className="text-sm text-slate-700 font-semibold block truncate">
              {profile?.name}
            </span>
            <span className="text-[10px] text-blue-500 font-medium block truncate">
              {profile?.role}
            </span>
          </div>
          <i
            className={cn(
              'ri-arrow-down-s-line text-slate-400 hidden sm:block transition-transform',
              showDropdown && 'rotate-180'
            )}
          ></i>
        </button>
        {showDropdown && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="닫기"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-xl shadow-xl py-2 z-50 bg-white border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-xs text-slate-500">{academy?.name}</p>
              </div>
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{profile?.name}</p>
                <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
              </div>
              <Link
                href="/settings"
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 min-h-[44px] flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                설정
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer min-h-[44px]"
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
