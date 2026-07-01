type ExamScoreItem = {
  studentId: string;
  score: number;
  previousScore?: number | null;
};

export function notifyExamScores(examId: string, items: ExamScoreItem[]) {
  if (items.length === 0) return;
  void fetch('/api/push/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'exam', examId, items }),
  }).catch(() => {});
}

export function notifyLessonScore(params: {
  studentId: string;
  score: number;
  lessonDate: string;
  unit?: string;
}) {
  void fetch('/api/push/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'lesson', ...params }),
  }).catch(() => {});
}
