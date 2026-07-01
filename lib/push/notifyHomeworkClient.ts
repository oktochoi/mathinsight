export function notifyHomeworkAssigned(assignmentId: string, studentIds?: string[]) {
  void fetch('/api/push/homework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentId, studentIds }),
  }).catch(() => {
    /* 푸시 실패는 숙제 저장과 분리 */
  });
}
