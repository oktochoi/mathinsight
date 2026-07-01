export function buildExamScoreMessage(params: {
  examName: string;
  score: number;
  maxScore?: number;
  previousScore?: number | null;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  const max = params.maxScore ?? 100;
  let body = `${params.examName} 결과 ${params.score}점이 등록되었습니다. (만점 ${max}점 · ${academy})`;

  if (
    params.previousScore != null &&
    params.score > params.previousScore &&
    params.score - params.previousScore >= 5
  ) {
    body = `${params.examName} ${params.score}점 — 이전보다 ${params.score - params.previousScore}점 올랐어요! (${academy})`;
  }

  return { title: '시험 결과 등록', body };
}

export function buildLessonScoreMessage(params: {
  unit: string;
  score: number;
  lessonDate: string;
  academyName?: string;
}): { title: string; body: string } {
  const academy = params.academyName?.trim() || '학원';
  const unit = params.unit.trim() || '수업';
  return {
    title: '점수 등록',
    body: `${unit} (${params.lessonDate}) ${params.score}점이 등록되었습니다. (${academy})`,
  };
}
