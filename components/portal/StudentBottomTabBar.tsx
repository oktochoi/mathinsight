'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { STUDENT_BOTTOM_NAV } from '@/lib/studentPortalNav';

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentBottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-sky-100 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      aria-label="학생 포털 메뉴"
    >
      <div className="flex items-stretch justify-around h-14">
        {STUDENT_BOTTOM_NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold min-w-0 px-1',
                active ? 'text-sky-700' : 'text-slate-500'
              )}
            >
              <i className={cn(item.icon, 'text-lg')} aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
