'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { PushInAppBanner } from '@/components/PushInAppBanner';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { StaffChatFab } from '@/components/chat/StaffChatFab';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';

function SidebarWithSearchParams(props: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  return <Sidebar {...props} />;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.onboarding_complete === false) {
      router.replace('/onboarding');
    }
  }, [loading, profile, router]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden app-bg"
    >
      <PushInAppBanner />
      <SubscriptionBanner />
      <Suspense fallback={null}>
        <SidebarWithSearchParams
          open={navOpen}
          onClose={() => setNavOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </Suspense>
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] lg:hidden cursor-pointer"
          aria-label="메뉴 닫기"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div
        className={cn(
          'flex min-h-screen min-h-[100dvh] flex-col min-w-0 w-full box-border transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        )}
      >
        <TopNav onMenuOpen={() => setNavOpen(true)} />
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 mobile-bottom-safe">
          <div className="w-full min-w-0 max-w-7xl xl:max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
      <StaffChatFab />
    </div>
  );
}
