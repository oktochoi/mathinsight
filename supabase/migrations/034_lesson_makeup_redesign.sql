-- migration 034: lesson makeup redesign
-- Adds started_at/by, lesson_type, original_lesson_id to lessons
-- Adds is_makeup to lesson_logs
-- Creates makeup_lesson_students table

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'regular'
    CHECK (lesson_type IN ('regular', 'makeup')),
  ADD COLUMN IF NOT EXISTS original_lesson_id uuid REFERENCES lessons(id);

ALTER TABLE lesson_logs
  ADD COLUMN IF NOT EXISTS is_makeup boolean NOT NULL DEFAULT false;

-- One regular lesson per class per date (canceled lessons excluded)
CREATE UNIQUE INDEX IF NOT EXISTS lessons_class_date_regular_uniq
  ON lessons(class_id, lesson_date)
  WHERE lesson_type = 'regular' AND status != 'canceled';

-- Tracks which students participate in a makeup lesson
CREATE TABLE IF NOT EXISTS makeup_lesson_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  original_lesson_id uuid REFERENCES lessons(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, student_id)
);

ALTER TABLE makeup_lesson_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY mls_staff_manage ON makeup_lesson_students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN classes c ON c.id = l.class_id
      WHERE l.id = makeup_lesson_students.lesson_id
        AND is_academy_staff()
    )
  );
