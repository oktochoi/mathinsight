import { redirect } from 'next/navigation';

/** Student Growth — `/retention` 으로 통합 (구 URL 호환) */
export default async function StudentGrowthRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const section = params.section;
  const q =
    typeof section === 'string' && section
      ? `?section=${encodeURIComponent(section)}`
      : '';
  redirect(`/retention${q}`);
}
