/** KST 기준 오늘 YYYY-MM-DD */
export function kstTodayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function daysUntilIso(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00+09:00`).getTime();
  const to = new Date(`${toIso}T12:00:00+09:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function formatKoreanDate(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00+09:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatAmountKrw(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
