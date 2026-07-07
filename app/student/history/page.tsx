import { redirect } from 'next/navigation';

/** 구 `/student/history` → 학습 탭 수업 기록 */
export default async function StudentHistoryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  redirect('/student/learning?tab=history');
}
