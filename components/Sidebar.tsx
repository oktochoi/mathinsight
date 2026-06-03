'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { BrandMark } from '@/components/brand/BrandMark';

const menuItems = [
  { label: '대시보드', href: '/dashboard', icon: 'ri-dashboard-line' },
  { label: '시간표', href: '/schedule', icon: 'ri-calendar-line' },
  { label: '학생 관리', href: '/students', icon: 'ri-group-line' },
  { label: '수업 기록', href: '/lesson-logs', icon: 'ri-book-open-line' },
  { label: '상담 카드', href: '/consultation-cards', icon: 'ri-chat-check-line' },
  { label: '학부모 리포트', href: '/parent-reports', icon: 'ri-file-chart-line' },
  { label: '분석', href: '/analytics', icon: 'ri-bar-chart-2-line' },
  { label: '설정', href: '/settings', icon: 'ri-settings-3-line' },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, academy, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose?.();
    router.replace('/auth');
  };

  const initial = profile?.name?.charAt(0) ?? '?';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen h-[100dvh] w-[min(280px,85vw)] max-w-[280px] flex-col',
        'transition-transform duration-300 ease-out lg:w-64',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{ background: 'linear-gradient(180deg, #0c1829 0%, #0f2040 60%, #0c1829 100%)' }}
      aria-hidden={!open ? undefined : false}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4 lg:px-6 lg:pt-8 lg:pb-6">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={onClose}>
          <div
            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
          >
            <i className="ri-bar-chart-box-fill text-white text-sm"></i>
          </div>
          <BrandMark variant="light" showTagline nameClassName="text-sm" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          aria-label="메뉴 닫기"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>

      <div className="px-4 mb-4">
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              {loading ? '…' : initial}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">
                {loading ? '불러오는 중' : profile?.name ?? '사용자'}
              </div>
              <div className="text-blue-400/70 text-[10px] truncate">
                {academy?.name ?? '학원'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto overscroll-contain">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all min-h-[44px]',
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
              style={
                active
                  ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }
                  : {}
              }
            >
              <i className={`${item.icon} text-base shrink-0`}></i>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-3">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="block rounded-xl p-3 text-[10px] leading-relaxed text-blue-200/90 hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <span className="font-semibold text-white text-xs block mb-1">사용 순서</span>
          ① 수업 기록 → ② 대시보드 → ③ 상담(필요 시)
        </Link>
      </div>

      <div className="p-4 pt-0 border-t border-white/5 safe-area-pb">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer min-h-[44px]"
        >
          <i className="ri-logout-box-line"></i>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
