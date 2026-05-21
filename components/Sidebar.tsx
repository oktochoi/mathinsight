'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'ri-dashboard-line' },
  { label: 'Students', href: '/students', icon: 'ri-group-line' },
  { label: 'Lesson Logs', href: '/lesson-logs', icon: 'ri-book-open-line' },
  { label: 'Consultation Cards', href: '/consultation-cards', icon: 'ri-chat-check-line' },
  { label: 'Parent Reports', href: '/parent-reports', icon: 'ri-file-chart-line' },
  { label: 'Analytics', href: '/analytics', icon: 'ri-bar-chart-2-line' },
  { label: 'Settings', href: '/settings', icon: 'ri-settings-3-line' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, academy, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initial = profile?.name?.charAt(0) ?? '?';

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: 'linear-gradient(180deg, #0c1829 0%, #0f2040 60%, #0c1829 100%)' }}
    >
      <div className="px-6 pt-8 pb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
          >
            <i className="ri-bar-chart-box-fill text-white text-sm"></i>
          </div>
          <div>
            <span className="text-white text-sm font-bold tracking-tight">MathInsight</span>
            <div className="text-[10px] text-blue-400/70 font-medium tracking-wider uppercase">
              Academy
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 mb-4">
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              {loading ? '…' : initial}
            </div>
            <div>
              <div className="text-white text-xs font-semibold">
                {loading ? '불러오는 중' : profile?.name ?? '사용자'}
              </div>
              <div className="text-blue-400/70 text-[10px] truncate max-w-[140px]">
                {academy?.name ?? '학원'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                active
                  ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }
                  : {}
              }
            >
              <i className={`${item.icon} text-base`}></i>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <i className="ri-logout-box-line"></i>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
