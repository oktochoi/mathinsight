import { formatKoreanDate } from '@/lib/push/pushDates';

export function buildHomeworkAssignedMessage(params: {
  title: string;
  dueDate: string;
  className?: string;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  const classPart = params.className?.trim() ? `${params.className} · ` : '';
  return {
    title: '새 숙제',
    body: `${classPart}${params.title} — 마감 ${formatKoreanDate(params.dueDate)} (${academy})`,
  };
}

export function buildHomeworkDueTomorrowMessage(params: {
  title: string;
  dueDate: string;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  return {
    title: '숙제 제출 안내',
    body: `내일까지 제출: ${params.title} (${formatKoreanDate(params.dueDate)} · ${academy})`,
  };
}
