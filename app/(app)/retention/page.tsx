import { redirect } from 'next/navigation';

/** 구 `/retention` → 경영 리포트로 통합 */
export default async function RetentionRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const section = params.section ?? params.student;
  const hash =
    typeof section === 'string' && section ? `#attention` : '#attention';
  redirect(`/analytics${hash}`);
}
