import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import StudentDetail from './StudentDetail';
import type { Student } from '@/types/database';


export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('students')
    .select('*, classes(name, grade)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return <StudentDetail studentId={id} initialStudent={data as Student} />;
}
