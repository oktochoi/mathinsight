/** 앱 표시 역할 (DB `admin` → owner) */
export type UserRole = 'owner' | 'teacher' | 'parent' | 'student';
export type StudentStatus = 'stable' | 'attention' | 'consultation';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type HomeworkStatus = 'complete' | 'partial' | 'missing';
export type ReportTone = 'friendly' | 'objective' | 'exam_focused' | 'encouraging';
export type ScheduleType = 'regular' | 'makeup' | 'special' | 'canceled';
export type ScheduleExceptionType = 'makeup' | 'canceled' | 'time_changed' | 'special';
export type FollowupStatus = 'pending' | 'done';
export type ConsultationStatus = 'pending' | 'completed';

export type StudentBadgeType =
  | 'needs_review'
  | 'homework_check'
  | 'score_change'
  | 'followup'
  | 'stable';

export interface Academy {
  id: string;
  name: string;
  owner_id: string;
  /** 마이그레이션 012 이후 */
  connection_code?: string;
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

export type ConnectionRelationship = 'mother' | 'father' | 'guardian' | 'student';
export type ConnectionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface StudentConnection {
  id: string;
  student_id: string;
  user_id: string;
  relationship: ConnectionRelationship;
  created_at: string;
  user?: Pick<UserProfile, 'id' | 'email' | 'name'> | null;
}

export interface StudentConnectionRequest {
  id: string;
  academy_id: string | null;
  student_id: string | null;
  user_id: string;
  relationship: ConnectionRelationship;
  requested_student_name: string | null;
  status: ConnectionRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user?: Pick<UserProfile, 'id' | 'email' | 'name'> | null;
  student?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface Student {
  id: string;
  academy_id: string;
  class_id: string | null;
  connection_code?: string | null;
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
  consultation_status: ConsultationStatus;
  consulted_at: string | null;
  consultation_note: string | null;
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

export interface ClassSchedule {
  id: string;
  academy_id: string;
  class_id: string;
  teacher_id: string | null;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  schedule_type: ScheduleType;
  location: string | null;
  memo: string | null;
  is_recurring: boolean;
  is_visible_to_parent: boolean;
  created_at: string;
  updated_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
  teacher?: Pick<UserProfile, 'id' | 'name'> | null;
}

export interface ScheduleException {
  id: string;
  academy_id: string;
  class_schedule_id: string | null;
  class_id: string;
  exception_date: string;
  exception_type: ScheduleExceptionType;
  start_time: string | null;
  end_time: string | null;
  memo: string | null;
  is_visible_to_parent: boolean;
  created_at: string;
}

export interface ConsultationFollowup {
  id: string;
  academy_id: string;
  student_id: string;
  consultation_card_id: string | null;
  title: string;
  memo: string;
  due_date: string | null;
  status: FollowupStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentBadge {
  type: StudentBadgeType;
  label: string;
  reason: string;
}

export interface CalendarLessonEvent {
  id: string;
  scheduleId: string | null;
  exceptionId: string | null;
  classId: string;
  className: string;
  classGrade: string;
  title: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  scheduleType: ScheduleType;
  location: string | null;
  memo: string | null;
  teacherName: string | null;
  isVisibleToParent: boolean;
}

export interface AttentionStudent {
  id: string;
  name: string;
  grade: string;
  className: string;
  status: StudentStatus;
  reason: string;
  urgency: 'high' | 'medium';
  riskKindLabel?: string;
  riskKind?: 'consultation' | 'makeup' | 'attention' | 'recovering' | 'stable';
}

export interface TodayLessonItem {
  event: CalendarLessonEvent;
  studentCount: number;
  attentionCount: number;
  followupCount: number;
  hasLogToday: boolean;
}

export interface ClassFlowSummary {
  classId: string;
  className: string;
  grade: string;
  avgScore: number | null;
  homeworkRate: number;
  recentUnit: string | null;
  attentionCount: number;
  hasRecentLog: boolean;
  nextLesson: CalendarLessonEvent | null;
}

export interface DashboardPriority {
  id: string;
  text: string;
  href: string;
  tone: 'success' | 'warning' | 'info' | 'muted' | 'danger';
}

export interface ActionActivity {
  time: string;
  text: string;
  type: 'lesson' | 'homework' | 'test' | 'consult' | 'report' | 'schedule';
}

export interface DashboardStats {
  todayLessonCount: number;
  todayClassCount: number;
  missingHomeworkCount: number;
  pendingConsultationCount: number;
  consultationRecommendedCount: number;
  scoreDeclineCount: number;
  homeworkTrend: { name: string; rate: number }[];
  classScoreTrend: { name: string; avg: number }[];
  attentionStudents: AttentionStudent[];
  recentReports: ParentReport[];
  recentActivities: ActionActivity[];
  todayLessons: TodayLessonItem[];
  classFlows: ClassFlowSummary[];
  todayPriorities: DashboardPriority[];
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
