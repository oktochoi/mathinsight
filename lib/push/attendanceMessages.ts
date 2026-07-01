import type { AttendanceStatus } from '@/types/database';

function formatLessonDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

/** 출결 푸시 제목·본문 */
export function buildAttendancePushMessage(params: {
  studentName: string;
  className: string;
  lessonDate: string;
  attendanceStatus: AttendanceStatus;
  academyName?: string;
}): { title: string; body: string } {
  const { studentName, className, lessonDate, attendanceStatus, academyName } = params;
  const when = formatLessonDate(lessonDate);
  const academy = academyName?.trim() || '학원';

  switch (attendanceStatus) {
    case 'present':
      return {
        title: '출석 알림',
        body: `${studentName} 학생이 ${when} ${className} 수업에 출석했습니다. (${academy})`,
      };
    case 'late':
      return {
        title: '지각 알림',
        body: `${studentName} 학생이 ${when} ${className} 수업에 지각 처리되었습니다. (${academy})`,
      };
    case 'absent':
      return {
        title: '결석 알림',
        body: `${studentName} 학생이 ${when} ${className} 수업에 결석 처리되었습니다. (${academy})`,
      };
  }
}
