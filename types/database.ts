export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';
export type StudentStatus = 'stable' | 'attention' | 'consultation';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type HomeworkStatus = 'complete' | 'partial' | 'missing';
export type ReportTone = 'friendly' | 'objective' | 'exam_focused' | 'encouraging';

export interface Academy {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  academy_id: string | null;
  created_at: string;
}

export interface ClassRow {
  id: string;
  academy_id: string;
  teacher_id: string | null;
  name: string;
  grade: string;
  created_at: string;
}

export interface Student {
  id: string;
  academy_id: string;
  class_id: string | null;
  parent_user_id: string | null;
  student_user_id: string | null;
  parent_invite_email: string | null;
  student_invite_email: string | null;
  name: string;
  school: string | null;
  grade: string;
  status: StudentStatus;
  created_at: string;
  classes?: ClassRow | null;
  parent_user?: { id: string; email: string; name: string } | null;
  student_portal?: { id: string; email: string; name: string } | null;
}

export interface LessonLog {
  id: string;
  academy_id: string;
  class_id: string;
  student_id: string;
  teacher_id: string | null;
  lesson_date: string;
  unit: string;
  attendance_status: AttendanceStatus;
  homework_status: HomeworkStatus;
  test_score: number | null;
  tags: string[];
  memo: string | null;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface ConsultationCard {
  id: string;
  student_id: string;
  generated_by: string | null;
  period_start: string;
  period_end: string;
  learning_summary: string;
  evidence_summary: string;
  consultation_points: string[];
  parent_message: string;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface ParentReport {
  id: string;
  student_id: string;
  generated_by: string | null;
  period_start: string;
  period_end: string;
  tone: ReportTone;
  report_text: string;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface AttentionStudent {
  id: string;
  name: string;
  grade: string;
  className: string;
  status: StudentStatus;
  reason: string;
  urgency: 'high' | 'medium';
}

export interface DashboardStats {
  todayLessonCount: number;
  todayClassCount: number;
  missingHomeworkCount: number;
  consultationRecommendedCount: number;
  scoreDeclineCount: number;
  homeworkTrend: { name: string; rate: number }[];
  classScoreTrend: { name: string; avg: number }[];
  attentionStudents: AttentionStudent[];
  recentReports: ParentReport[];
  recentActivities: { time: string; text: string; type: string }[];
}

export interface LessonLogInsert {
  academy_id: string;
  class_id: string;
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  unit: string;
  attendance_status: AttendanceStatus;
  homework_status: HomeworkStatus;
  test_score: number | null;
  tags: string[];
  memo: string | null;
}
