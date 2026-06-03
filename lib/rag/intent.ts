import type { RagChunkSource } from '@/lib/rag/types';

const ALL_SOURCES: RagChunkSource[] = [
  'student_profile',
  'scores',
  'homework',
  'attendance',
  'consultation',
  'consultation_card',
  'parent_report',
  'tags',
  'memo',
  'schedule',
];

/** 학부모 질문 → 검색할 데이터 영역 */
export function routeQuestionIntent(question: string): RagChunkSource[] {
  const q = question.trim();

  if (/점수|성적|시험|평균|하락|올랐/.test(q)) {
    return ['scores', 'student_profile', 'tags', 'memo', 'homework'];
  }
  if (/숙제|제출|미제출|과제/.test(q)) {
    return ['homework', 'memo', 'tags', 'scores'];
  }
  if (/출석|결석|지각/.test(q)) {
    return ['attendance', 'homework', 'memo'];
  }
  if (/상담|면담|선생님/.test(q)) {
    return ['consultation', 'consultation_card', 'parent_report', 'memo'];
  }
  if (/단원|진도|함수|수학|과목/.test(q)) {
    return ['scores', 'homework', 'memo', 'tags', 'student_profile'];
  }
  if (/리포트|보고|주간|월간/.test(q)) {
    return ['parent_report', 'consultation_card', 'scores', 'homework'];
  }
  if (/시간표|수업|일정|보강/.test(q)) {
    return ['schedule', 'student_profile', 'attendance'];
  }
  if (/상태|최근|어떤|공부|학습/.test(q)) {
    return ['scores', 'homework', 'consultation', 'tags', 'memo', 'parent_report'];
  }

  return ALL_SOURCES;
}

export function chunkMatchesIntent(
  source: RagChunkSource,
  intents: RagChunkSource[]
): boolean {
  return intents.includes(source);
}
