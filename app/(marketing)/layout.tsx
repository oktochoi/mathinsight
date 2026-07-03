import { MarketingJsonLd } from '@/components/marketing/MarketingJsonLd';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingJsonLd />
      <MarketingShell>{children}</MarketingShell>
    </>
  );
}
