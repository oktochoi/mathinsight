import type { AttendanceStatus } from '@/types/database';

export type AttendancePushPayload = {
  lessonDate: string;
  classId: string;
  className?: string;
  academyName?: string;
  items: Array<{ studentId: string; attendanceStatus: AttendanceStatus }>;
};

/** 출결 저장 후 학부모 푸시 (UI 블로킹 없음) */
export function notifyAttendancePushBatch(payload: AttendancePushPayload) {
  if (payload.items.length === 0) return;

  void fetch('/api/push/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* 푸시 실패는 출결 저장과 분리 */
  });
}
