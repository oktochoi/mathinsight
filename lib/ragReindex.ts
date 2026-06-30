/** 수업 기록 저장 후 학부모 AI 메모리 백그라운드 갱신 */
export function triggerStudentRagReindex(studentId: string) {
  if (typeof window === 'undefined' || !studentId) return;
  void fetch('/api/rag/index-student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  }).catch(() => {});
}
