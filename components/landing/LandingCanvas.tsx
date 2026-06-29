import type { ReactNode } from 'react';

export function LandingCanvas({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ef-landing min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased ${className}`}>
      {children}
    </div>
  );
}
