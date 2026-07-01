export function buildAnnouncementPushMessage(params: {
  title: string;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  return {
    title: '학원 공지',
    body: `${params.title} — 새 공지가 등록되었습니다. (${academy})`,
  };
}
