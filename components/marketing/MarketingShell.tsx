import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingProviders } from '@/components/marketing/providers/MarketingProviders';
import { mkt } from '@/lib/marketing/ui';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <MarketingProviders>
      <div className={mkt.site}>
        <MarketingHeader />
        <main>{children}</main>
        <MarketingFooter />
      </div>
    </MarketingProviders>
  );
}
