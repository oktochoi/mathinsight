import { redirect } from 'next/navigation';

/** 구 `/student-growth` → 경영 리포트 */
export default async function StudentGrowthRedirectPage() {
  redirect('/analytics');
}
