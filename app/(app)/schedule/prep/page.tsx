import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ classId?: string; date?: string }>;
};

/** @deprecated /schedule?classId=&date= 로 통합 */
export default async function SchedulePrepRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.classId) q.set('classId', params.classId);
  if (params.date) q.set('date', params.date);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  redirect(`/schedule${suffix}`);
}
