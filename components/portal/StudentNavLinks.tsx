'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { STUDENT_SIDEBAR_NAV } from '@/lib/studentPortalNav';

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentNavLinks({ vertical }: { vertical?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {STUDENT_SIDEBAR_NAV.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              vertical
                ? cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-sky-100 text-sky-800 font-semibold'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                  )
                : cn('student-nav-pill shrink-0 gap-1.5', active && 'bg-sky-100 text-sky-800')
            )}
          >
            <i className={cn(item.icon, vertical && 'text-lg text-sky-600')} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
