/** 학부모 Agent — 앱에 그대로 표시되는 평문 답변 정리 */

export function formatParentAgentAnswer(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  // 마크다운 강조·코드
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 제목·링크
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 불릿 통일 (마크다운 리스트 기호 → •)
  text = text.replace(/^\s*[-*]\s+/gm, '• ');

  // 빈 줄 정리
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
