const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

/** 한글 문자열의 초성 문자열 (비한글은 그대로) */
export function hangulChosung(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      out += CHOSUNG[idx] ?? ch;
    } else {
      out += ch;
    }
  }
  return out;
}

/** 이름·검색어 매칭 (부분 일치 + 초성) */
export function matchesHangulSearch(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  const chosung = hangulChosung(text);
  if (chosung.includes(q)) return true;
  if (q.split('').every((c, i) => chosung[i] === c)) return true;
  return false;
}
