'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchLessonLogs } from '@/lib/lessonLogsRead';
import type { Exam, ExamScore, HomeworkAssignment, HomeworkSubmission } from '@/types/database';
import { ATTENDANCE_LABELS, HOMEWORK_LABELS } from '@/lib/statusLabels';

export interface PortalAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  recent: { date: string; status: string; label: string }[];
}

export function usePortalAttendance(studentId?: string, limit = 30) {
  const [summary, setSummary] = useState<PortalAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    void fetchLessonLogs({ studentId, limit }).then(({ logs }) => {
      let present = 0;
      let late = 0;
      let absent = 0;
      for (const l of logs) {
        if (l.attendance_status === 'present') present += 1;
        else if (l.attendance_status === 'late') late += 1;
        else absent += 1;
      }
      setSummary({
        present,
        late,
        absent,
        recent: logs.slice(0, 6).map((l) => ({
          date: l.lesson_date,
          status: l.attendance_status,
          label: ATTENDANCE_LABELS[l.attendance_status],
        })),
      });
      setLoading(false);
    });
  }, [studentId, limit]);

  return { summary, loading };
}

export function usePortalHomework(studentId?: string, classId?: string | null) {
  const [assignments, setAssignments] = useState<
    (HomeworkAssignment & { submission?: HomeworkSubmission })[]
  >([]);
  const [recentHw, setRecentHw] = useState<
    { date: string; status: string; label: string; unit: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);

    const load = async () => {
      const { logs } = await fetchLessonLogs({ studentId, limit: 8 });

      setRecentHw(
        logs.map((l) => ({
          date: l.lesson_date,
          status: l.homework_status,
          label: HOMEWORK_LABELS[l.homework_status],
          unit: l.unit,
        }))
      );

      if (classId) {
        const { data: hwList } = await supabase
          .from('homework_assignments')
          .select('*')
          .eq('class_id', classId)
          .order('due_date', { ascending: false })
          .limit(6);

        const ids = (hwList ?? []).map((a) => a.id);
        let subs: HomeworkSubmission[] = [];
        if (ids.length > 0) {
          const { data: subData } = await supabase
            .from('homework_submissions')
            .select('*')
            .eq('student_id', studentId)
            .in('assignment_id', ids);
          subs = (subData ?? []) as HomeworkSubmission[];
        }

        setAssignments(
          ((hwList ?? []) as HomeworkAssignment[]).map((a) => ({
            ...a,
            submission: subs.find((s) => s.assignment_id === a.id),
          }))
        );
      }
      setLoading(false);
    };

    void load();
  }, [studentId, classId]);

  return { assignments, recentHw, loading };
}

export function usePortalExams(studentId?: string) {
  const [exams, setExams] = useState<(Exam & { score?: ExamScore })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);

    const load = async () => {
      const { data: scores } = await supabase
        .from('exam_scores')
        .select('*, exams(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(8);

      const list = ((scores ?? []) as (ExamScore & { exams: Exam })[]).map((row) => ({
        ...row.exams,
        score: row,
      }));
      setExams(list);
      setLoading(false);
    };

    void load();
  }, [studentId]);

  return { exams, loading };
}
