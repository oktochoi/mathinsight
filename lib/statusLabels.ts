import type { StudentStatus, HomeworkStatus, AttendanceStatus } from '@/types/database';

export const STATUS_LABELS: Record<StudentStatus, string> = {
  stable: '안정',
  attention: '주의',
  consultation: '상담 권장',
};

export const STATUS_STYLES: Record<StudentStatus, string> = {
  stable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  attention: 'bg-amber-50 text-amber-700 border-amber-200',
  consultation: 'bg-red-50 text-red-700 border-red-200',
};

export const HOMEWORK_LABELS: Record<HomeworkStatus, string> = {
  complete: '완료',
  partial: '부분',
  missing: '미제출',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
};
