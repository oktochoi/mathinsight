'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

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
      className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)',
      }}
    >
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden cursor-pointer"
          aria-label="메뉴 닫기"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* ml 대신 pl — w-full + margin 조합으로 가로 스크롤이 생기지 않도록 */}
      <div className="flex min-h-screen min-h-[100dvh] flex-col min-w-0 w-full box-border lg:pl-64">
        <TopNav onMenuOpen={() => setNavOpen(true)} />
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
