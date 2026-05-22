/** 학부모 리포트 본문 정리·섹션 파싱 (마크다운 ** 미지원 UI용) */

export interface ParentReportSection {
  heading: string;
  body: string;
}

export interface ParsedParentReport {
  title: string | null;
  intro: string | null;
  sections: ParentReportSection[];
  closing: string | null;
}

const KNOWN_SECTIONS = [
  '이번 기간 한눈에',
  '수업에서 다룬 내용',
  '숙제와 학습 습관',
  '평가·시험',
  '평가 및 시험',
  '함께 보면 좋은 부분',
  '맺음말',
  '학습 요약',
  '다룬 단원',
  '숙제',
  '테스트',
  '기록 근거',
] as const;

/** AI가 넣는 마크다운·장식 제거 (단일 * 는 제거하지 않음 — 본문 손실 방지) */
export function sanitizeParentReportText(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

function matchSectionHeading(line: string): { heading: string; inlineBody: string | null } | null {
  const bracket = line.match(/^\[([^\]]+)\]\s*$/);
  if (bracket) return { heading: bracket[1].trim(), inlineBody: null };

  const bracketInline = line.match(/^\[([^\]]+)\]\s+(.+)$/);
  if (bracketInline) {
    return { heading: bracketInline[1].trim(), inlineBody: bracketInline[2].trim() };
  }

  for (const known of KNOWN_SECTIONS) {
    if (line === known) return { heading: known, inlineBody: null };
    if (line.startsWith(`${known}:`)) {
      return { heading: known, inlineBody: line.slice(known.length + 1).trim() || null };
    }
    if (line.startsWith(`${known} `) && line.length > known.length + 2) {
      return { heading: known, inlineBody: line.slice(known.length).trim() };
    }
  }
  return null;
}

function isTitleLine(line: string): boolean {
  return /학습\s*리포트/i.test(line) && line.length < 120;
}

function isClosingLine(line: string): boolean {
  return /드림\s*$/i.test(line.trim()) || /^옥토|^.{0,20}학원\s*드림/i.test(line.trim());
}

export function parseParentReportText(raw: string): ParsedParentReport {
  const text = sanitizeParentReportText(raw);
  const lines = text.split('\n');

  let title: string | null = null;
  const introLines: string[] = [];
  const sections: ParentReportSection[] = [];
  const closingLines: string[] = [];

  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  let phase: 'intro' | 'section' | 'closing' = 'intro';

  const flushSection = () => {
    if (!currentHeading) return;
    const body = currentBody.join('\n').trim();
    if (body) sections.push({ heading: currentHeading, body });
    currentHeading = null;
    currentBody = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (phase === 'section' && currentHeading) currentBody.push('');
      else if (phase === 'intro' && introLines.length > 0) introLines.push('');
      continue;
    }

    if (!title && isTitleLine(trimmed)) {
      title = trimmed;
      continue;
    }

    const section = matchSectionHeading(trimmed);
    if (section) {
      flushSection();
      phase = 'section';
      currentHeading = section.heading;
      if (section.inlineBody) currentBody.push(section.inlineBody);
      continue;
    }

    if (isClosingLine(trimmed) && sections.length > 0) {
      flushSection();
      phase = 'closing';
      closingLines.push(trimmed);
      continue;
    }

    if (phase === 'closing') {
      closingLines.push(trimmed);
      continue;
    }

    if (phase === 'intro' && sections.length === 0 && !currentHeading) {
      introLines.push(trimmed);
      continue;
    }

    if (!currentHeading) {
      phase = 'section';
      currentHeading = '요약';
    }
    currentBody.push(trimmed);
  }

  flushSection();

  if (sections.length === 0 && introLines.length === 0 && text) {
    return {
      title,
      intro: null,
      sections: [{ heading: '본문', body: text }],
      closing: null,
    };
  }

  return {
    title,
    intro: introLines.join('\n').trim() || null,
    sections,
    closing: closingLines.join('\n').trim() || null,
  };
}

/** 파서가 본문을 과도하게 잃었는지 (표시용 폴백) */
export function isParentReportParseIncomplete(raw: string, parsed: ParsedParentReport): boolean {
  const sanitized = sanitizeParentReportText(raw);
  if (sanitized.length < 120) return false;

  const captured =
    (parsed.intro?.length ?? 0) +
    parsed.sections.reduce((n, s) => n + s.body.length, 0) +
    (parsed.closing?.length ?? 0);

  if (captured < sanitized.length * 0.45) return true;

  const hasCoreSections = parsed.sections.some((s) =>
    ['이번 기간 한눈에', '수업에서 다룬 내용', '맺음말'].includes(s.heading)
  );
  if (parsed.sections.length <= 1 && sanitized.includes('[') && !hasCoreSections) {
    return true;
  }

  const shortest = parsed.sections.find((s) => s.body.length <= 2);
  if (shortest && sanitized.length > 400) return true;

  return false;
}
