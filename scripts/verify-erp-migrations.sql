-- ERP 마이그레이션 023~028 적용 후 검증 (Supabase SQL Editor)

select 'staff_profiles' as tbl, count(*)::int as cnt from staff_profiles
union all select 'parents', count(*)::int from parents
union all select 'parent_student_links', count(*)::int from parent_student_links
union all select 'student_enrollments', count(*)::int from student_enrollments
union all select 'lessons', count(*)::int from lessons
union all select 'attendance_records', count(*)::int from attendance_records
union all select 'lesson_scores', count(*)::int from lesson_scores
union all select 'student_risk_snapshots', count(*)::int from student_risk_snapshots
union all select 'reregistration_records', count(*)::int from reregistration_records
union all select 'lesson_logs', count(*)::int from lesson_logs;

select
  count(*)::int as total_logs,
  count(lesson_id)::int as linked_logs,
  round(100.0 * count(lesson_id) / nullif(count(*), 0), 1) as link_pct
from lesson_logs;

select status, count(*)::int from lessons group by status order by status;

select
  count(*)::int as sessions,
  count(counselor_id)::int as with_counselor,
  count(parent_id)::int as with_parent
from counseling_sessions;

select count(*)::int as teacher_student_rows from v_teacher_students;
