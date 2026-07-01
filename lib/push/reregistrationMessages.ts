export function buildReregistrationReminderMessage(params: {
  studentName: string;
  termName: string;
  termEndDate: string;
  daysLeft: number;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  const endLabel = new Date(`${params.termEndDate}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
  });

  return {
    title: '재등록 안내',
    body: `${params.studentName} 학생의 ${params.termName} 등록 마감이 ${params.daysLeft}일 남았습니다. (${endLabel}까지 · ${academy})`,
  };
}
