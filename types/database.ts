/** 앱 표시 역할 (DB `admin` → owner, `desk` = 원무) */
export type UserRole = 'owner' | 'teacher' | 'desk' | 'parent' | 'student';
export type StudentStatus = 'stable' | 'attention' | 'consultation';
export type EnrollmentStatus = 'prospect' | 'active' | 'on_leave' | 'withdrawn' | 'graduated';
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
  /** 공개 학원 코드 (예: HAN823) — 마이그레이션 044 */
  academy_code?: string;
  /** 레거시 EDU-XXXX-XX — 호환용 */
  connection_code?: string;
  /** 공개 코드 마지막 발급 시각 (052) */
  academy_code_issued_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  academy_id: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  birthdate?: string | null;
  avatar_url?: string | null;
  school?: string | null;
  grade?: string | null;
  onboarding_complete?: boolean;
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
  requester_school?: string | null;
  requester_grade?: string | null;
  status: ConnectionRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user?: Pick<UserProfile, 'id' | 'email' | 'name' | 'school' | 'grade'> | null;
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
  phone?: string | null;
  status: StudentStatus;
  enrollment_status: EnrollmentStatus;
  registered_at: string | null;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  acquisition_source?: string | null;
  acquisition_source_other?: string | null;
  created_at: string;
  classes?: ClassRow | null;
  parent_user?: { id: string; email: string; name: string } | null;
  student_portal?: { id: string; email: string; name: string } | null;
}

export interface HomeworkAssignment {
  id: string;
  academy_id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string;
  lesson_date: string | null;
  unit: string | null;
  created_by: string | null;
  created_at: string;
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
  lesson_id?: string | null;
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
  academy_id?: string;
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

export interface DashboardCounselingItem {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  status: string;
  scheduledAt: string | null;
}

export interface DashboardRetentionRisk {
  studentId: string;
  name: string;
  grade: string;
  reason: string;
  riskLevel: string;
}

export interface DashboardWeeklyPoint {
  name: string;
  count?: number;
  rate?: number;
}

export interface DashboardChecklistItem {
  id: string;
  label: string;
  detail?: string;
  href: string;
  done: boolean;
  pendingCount: number;
}

export interface DashboardAiRecommendation {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  category: 'counseling' | 'learning' | 'retention';
  href: string;
}

export interface DashboardNoticeItem {
  id: string;
  title: string;
  publishedAt: string | null;
}

export interface DashboardStats {
  todayLessonCount: number;
  todayClassCount: number;
  missingHomeworkCount: number;
  pendingConsultationCount: number;
  pendingParentMessagesCount: number;
  consultationRecommendedCount: number;
  scoreDeclineCount: number;
  absentTodayCount: number;
  lateTodayCount: number;
  presentTodayCount: number;
  makeupNeededCount: number;
  pendingAttendanceInputCount: number;
  pendingHomeworkCheckCount: number;
  totalStudentCount: number;
  homeworkTrend: { name: string; rate: number }[];
  classScoreTrend: { name: string; avg: number }[];
  weeklyCounselingTrend: DashboardWeeklyPoint[];
  dailyAttendanceTrend: DashboardWeeklyPoint[];
  weeklyAttendanceTrend: DashboardWeeklyPoint[];
  studentCountTrend: DashboardWeeklyPoint[];
  consultationCompletionRate: number;
  todayChecklist: DashboardChecklistItem[];
  aiRecommendations: DashboardAiRecommendation[];
  recentNotices: DashboardNoticeItem[];
  attentionStudents: AttentionStudent[];
  worseningStudents: AttentionStudent[];
  retentionRiskStudents: DashboardRetentionRisk[];
  todayCounselingQueue: DashboardCounselingItem[];
  incompleteCounselingCount: number;
  recentReports: ParentReport[];
  recentActivities: ActionActivity[];
  todayLessons: TodayLessonItem[];
  classFlows: ClassFlowSummary[];
  todayPriorities: DashboardPriority[];
  morningBriefLines: string[];
  overduePaymentsCount: number;
  retentionHighRiskCount: number;
  unclosedLessonsToday: DashboardUnclosedLesson[];
  dashboardMode: 'owner' | 'teacher';
}

export type StoredRiskLevel =
  | 'stable'
  | 'attention'
  | 'consultation'
  | 'makeup'
  | 'recovering';

export type AgentType =
  | 'risk_detection'
  | 'counseling'
  | 'parent_communication'
  | 'dashboard'
  | 'parent_rag';

export type AgentLogStatus = 'running' | 'completed' | 'failed' | 'pending';

export interface StudentRiskSignal {
  id: string;
  academy_id: string;
  student_id: string;
  risk_level: StoredRiskLevel;
  reason: string;
  signals: { id: string; label: string }[];
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface AgentLog {
  id: string;
  academy_id: string;
  agent_type: AgentType;
  student_id: string | null;
  status: AgentLogStatus;
  action: string;
  result: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardAgentInsight {
  consultationStudents: { id: string; name: string; grade: string; reason: string }[];
  makeupStudents: { id: string; name: string; grade: string; reason: string }[];
  parentContactStudents: { id: string; name: string; grade: string; reason: string }[];
  /** 조치 목록에 안 나오는 양호·회복 인원 요약 */
  riskSummary: {
    stable: number;
    recovering: number;
    consultation: number;
    makeup: number;
    attention: number;
  };
  priorityExplanation: string;
  agentStatuses: {
    agentType: AgentType;
    label: string;
    status: AgentLogStatus;
    lastRunAt: string | null;
  }[];
}

export interface CounselingAgentResult {
  summary: string;
  mainIssues: string[];
  consultationPoints: string[];
  recommendedActions: string[];
  source: 'gemini' | 'rules';
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

export interface Exam {
  id: string;
  academy_id: string;
  class_id: string;
  name: string;
  subject: string;
  unit_scope: string | null;
  exam_date: string;
  max_score: number;
  created_by: string | null;
  created_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
}

export interface ExamScore {
  id: string;
  exam_id: string;
  student_id: string;
  score: number | null;
  feedback_memo: string | null;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface HomeworkAssignment {
  id: string;
  academy_id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string;
  lesson_date: string | null;
  unit: string | null;
  created_by: string | null;
  created_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
}

export interface HomeworkSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: HomeworkStatus;
  feedback_memo: string | null;
  lesson_log_id: string | null;
  updated_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export type CounselingSessionType =
  | 'parent'
  | 'student'
  | 'learning'
  | 'reregistration'
  | 'intake';
export type CounselingSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'followup_needed';

export interface CounselingSession {
  id: string;
  academy_id: string;
  student_id: string;
  consultation_card_id: string | null;
  session_type: CounselingSessionType;
  status: CounselingSessionStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  next_session_at: string | null;
  title: string;
  summary: string | null;
  parent_message_draft: string | null;
  followup_checklist: { id: string; label: string; done: boolean }[];
  recording_url?: string | null;
  transcript?: string | null;
  transcript_source?: 'manual' | 'stt' | 'ai_summary' | null;
  created_by: string | null;
  counselor_id?: string | null;
  parent_id?: string | null;
  enrollment_id?: string | null;
  created_at: string;
  updated_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export type AcquisitionSource =
  | 'parent_referral'
  | 'friend_referral'
  | 'sibling_enrolled'
  | 'naver_search'
  | 'blog'
  | 'instagram'
  | 'flyer'
  | 'banner'
  | 'walk_in'
  | 'school_referral'
  | 'reregistration'
  | 'other';

export type IntakeStatus =
  | 'scheduled'
  | 'completed'
  | 'registered'
  | 'on_hold'
  | 'not_registered'
  | 'no_show';

export type IntakeNextAction =
  | 'follow_up'
  | 'level_test'
  | 'trial_lesson'
  | 'enrollment_guide'
  | 'on_hold';

export type NotRegisteredReason =
  | 'cost'
  | 'schedule_conflict'
  | 'distance'
  | 'competitor'
  | 'parent_hold'
  | 'student_declined'
  | 'other';

export type RegistrationLikelihood = 'low' | 'medium' | 'high';

export interface IntakeConsultation {
  id: string;
  academy_id: string;
  counseling_session_id: string | null;
  student_id: string;
  prospect_name: string;
  grade: string;
  school: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  interested_subjects: string | null;
  preferred_class: string | null;
  counselor_id: string | null;
  acquisition_source: AcquisitionSource | string | null;
  acquisition_source_other: string | null;
  intake_status: IntakeStatus;
  consultation_content: string | null;
  parent_needs: string | null;
  student_level: string | null;
  recommended_class: string | null;
  recommended_subject: string | null;
  registration_likelihood: RegistrationLikelihood | null;
  next_action: IntakeNextAction | null;
  followup_date: string | null;
  registered: boolean;
  not_registered_reason: NotRegisteredReason | string | null;
  not_registered_reason_other: string | null;
  created_at: string;
  updated_at: string;
  counseling_sessions?: Pick<
    CounselingSession,
    'id' | 'scheduled_at' | 'status' | 'title'
  > | null;
}

export interface GrowthPipelineMetrics {
  month: string;
  inquiries: number;
  scheduled: number;
  completed: number;
  registered: number;
  conversionRate: number;
  bySource: { source: string; label: string; count: number; registered: number; rate: number }[];
  byNotRegisteredReason: { reason: string; label: string; count: number }[];
}

export type AnnouncementTargetType = 'all' | 'class' | 'student';
export type AnnouncementStatus = 'draft' | 'published';
export type ParentMessageStatus = 'pending' | 'answered';

export interface Announcement {
  id: string;
  academy_id: string;
  title: string;
  body: string;
  target_type: AnnouncementTargetType;
  class_id: string | null;
  student_id: string | null;
  status: AnnouncementStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface ParentMessage {
  id: string;
  academy_id: string;
  student_id: string | null;
  parent_user_id: string;
  subject: string;
  body: string;
  status: ParentMessageStatus;
  staff_reply: string | null;
  ai_draft_reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  source_session_id: string | null;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
  parent_user?: Pick<UserProfile, 'id' | 'name' | 'email'> | null;
}

export interface LessonSummary {
  lesson_id: string;
  academy_id: string;
  class_id: string;
  lesson_date: string;
  unit: string;
  teacher_id: string | null;
  lesson_status: string;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_rate: number | null;
  homework_complete_count: number;
  homework_partial_count: number;
  homework_missing_count: number;
  homework_rate: number | null;
  scored_count: number;
  avg_score: number | null;
  max_score: number | null;
  min_score: number | null;
}

export interface CurriculumUnit {
  id: string;
  academy_id: string;
  subject: string;
  grade: string;
  unit_name: string;
  sort_order: number;
  created_at: string;
}

export interface ClassProgress {
  id: string;
  academy_id: string;
  class_id: string;
  curriculum_unit_id: string | null;
  unit_name: string;
  notes: string | null;
  updated_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'waived';
export type NotificationChannel = 'sms' | 'kakao' | 'in_app';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'demo';
export type RetentionRiskLevel = 'low' | 'medium' | 'high';

export interface StudentPayment {
  id: string;
  academy_id: string;
  student_id: string;
  title: string;
  billing_month: string | null;
  amount: number;
  due_date: string;
  status: PaymentStatus;
  paid_at: string | null;
  payment_method: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface NotificationLog {
  id: string;
  academy_id: string;
  channel: NotificationChannel;
  recipient_label: string;
  recipient_user_id: string | null;
  student_id: string | null;
  message: string;
  template_key: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AcademyIntegrations {
  academy_id: string;
  google_calendar_enabled: boolean;
  google_calendar_id: string | null;
  ics_feed_token: string;
  sms_enabled: boolean;
  kakao_enabled: boolean;
  sms_sender_name: string | null;
  kakao_channel_name: string | null;
  updated_at: string;
}

export interface RetentionSignal {
  id: string;
  academy_id: string;
  student_id: string;
  risk_level: RetentionRiskLevel;
  score: number;
  reason: string;
  signals: { id: string; label: string }[];
  created_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

/** ERP 023+ */
export type LessonOperationalStatus =
  | 'scheduled'
  | 'in_progress'
  | 'closed'
  | 'canceled';

export type EnrollmentLifecycleStatus =
  | 'prospect'
  | 'active'
  | 'on_leave'
  | 'withdrawn'
  | 'graduated';

export type ReregistrationStatus =
  | 'pending'
  | 'contacted'
  | 'confirmed'
  | 'declined'
  | 'deferred';

export type RiskSnapshotType = 'learning' | 'retention';

export interface StaffProfile {
  id: string;
  user_id: string;
  academy_id: string;
  employment_status: 'active' | 'on_leave' | 'resigned';
  phone: string | null;
  hire_date: string | null;
  permissions: Record<string, unknown>;
}

export type LessonType = 'regular' | 'makeup';

export interface LessonRow {
  id: string;
  academy_id: string;
  class_id: string;
  lesson_date: string;
  teacher_id: string | null;
  staff_id: string | null;
  unit: string;
  topic: string | null;
  lesson_memo: string | null;
  status: LessonOperationalStatus;
  lesson_type: LessonType;
  started_at: string | null;
  started_by: string | null;
  original_lesson_id: string | null;
  created_at: string;
  updated_at: string;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
}

export interface AttendanceRecord {
  id: string;
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  checked_at: string;
  memo: string | null;
}

export interface LessonScoreRow {
  id: string;
  lesson_id: string;
  student_id: string;
  score: number;
  max_score: number;
}

export interface ParentEntity {
  id: string;
  academy_id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: ConnectionRelationship | 'other';
  is_primary: boolean;
  is_emergency_contact: boolean;
  parents?: ParentEntity | null;
}

export interface StudentEnrollment {
  id: string;
  academy_id: string;
  student_id: string;
  class_id: string;
  status: 'active' | 'ended' | 'transferred';
  start_date: string;
  end_date: string | null;
  classes?: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
}

export interface StudentRiskSnapshot {
  id: string;
  academy_id: string;
  student_id: string;
  snapshot_type: RiskSnapshotType;
  risk_level: string;
  score: number;
  reason: string;
  signals: { id: string; label: string }[];
  created_at: string;
}

export interface ReregistrationRecord {
  id: string;
  academy_id: string;
  student_id: string;
  term_id: string | null;
  status: ReregistrationStatus;
  counseling_session_id: string | null;
  parent_id: string | null;
  decided_at: string | null;
  decline_reason: string | null;
  memo: string | null;
  updated_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
}

export interface DashboardUnclosedLesson {
  lessonId: string;
  classId: string;
  className: string;
  status: string;
  lessonDate: string;
}

export interface StaffScope {
  staffProfileId: string | null;
  classIds: string[];
  studentIds: string[];
  isTeacher: boolean;
  isOwner: boolean;
  loading: boolean;
}

export type ChatChannelType = 'direct' | 'class_group';

export type ChatDirectAudience = 'parent' | 'student';

export interface ChatChannel {
  id: string;
  academy_id: string;
  type: ChatChannelType;
  class_id: string | null;
  student_id: string | null;
  direct_audience?: ChatDirectAudience | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  students?: Pick<Student, 'id' | 'name' | 'grade'> | null;
  classes?: Pick<ClassRow, 'id' | 'name'> | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  sender?: Pick<UserProfile, 'id' | 'name'> | null;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'expired' | 'canceled';
export type SubscriptionPlan = 'free' | 'starter' | 'growth' | 'pro';

export interface AcademySubscription {
  id: string;
  academy_id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_provider: string;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}
