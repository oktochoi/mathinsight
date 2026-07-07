import { redirect } from 'next/navigation';

/** 구 `/student-review` → 경영 리포트 */
export default async function StudentReviewRedirectPage() {
  redirect('/analytics');
}
