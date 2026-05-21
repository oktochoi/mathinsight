'use client';

import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)',
      }}
    >
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <TopNav />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
