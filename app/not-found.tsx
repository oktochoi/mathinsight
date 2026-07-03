import type { Metadata } from 'next';
import { ErrorPageShell } from '@/components/site/ErrorPageShell';
import { buildPageMetadata, ERROR_PAGE_SEO } from '@/lib/marketing/seo';

export const metadata: Metadata = buildPageMetadata(ERROR_PAGE_SEO.notFound);

export default function NotFound() {
  return (
    <ErrorPageShell
      statusCode={404}
      title="페이지를 찾을 수 없습니다"
      description="주소를 확인하거나 홈으로 이동해 주세요. 찾으시는 메뉴가 있다면 상단 네비게이션 또는 도입 문의를 이용해 주세요."
    />
  );
}
