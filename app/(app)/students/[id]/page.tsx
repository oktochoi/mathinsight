'use client';

import { useParams } from 'next/navigation';
import StudentDetail from './StudentDetail';

export default function StudentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  return <StudentDetail studentId={id} />;
}
