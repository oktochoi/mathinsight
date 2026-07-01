'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { PARENT_SIDEBAR_NAV } from '@/lib/parentPortalNav';

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ParentNavLinks({ vertical }: { vertical?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {PARENT_SIDEBAR_NAV.map((item) => {
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
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-stone-600 hover:bg-indigo-50 hover:text-indigo-700'
                  )
                : cn('parent-nav-pill shrink-0 gap-1.5', active && 'bg-indigo-50 text-indigo-700')
            )}
          >
            <i className={cn(item.icon, vertical && 'text-lg text-indigo-500')} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
