import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { assessRetentionRisk } from '@/lib/retentionPrediction';
import { paymentOverdue } from '@/lib/retentionPrediction';
import type { LessonLog, Student, StudentPayment } from '@/types/database';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const academyId = auth.academyId;
    const today = new Date().toISOString().slice(0, 10);

    const [studentsRes, logsRes, paymentsRes, counselingRes] = await Promise.all([
      supabase.from('students').select('id, name, grade, status').eq('academy_id', academyId),
      supabase
        .from('lesson_logs')
        .select('*')
        .eq('academy_id', academyId)
        .order('lesson_date', { ascending: false })
        .limit(800),
      supabase
        .from('student_payments')
        .select('*')
        .eq('academy_id', academyId)
        .in('status', ['pending', 'overdue']),
      supabase
        .from('counseling_sessions')
        .select('student_id, status')
        .eq('academy_id', academyId)
        .in('status', ['scheduled', 'in_progress']),
    ]);

    if (studentsRes.error) {
      return NextResponse.json({ ok: false, error: studentsRes.error.message }, { status: 500 });
    }

    const students = (studentsRes.data ?? []) as Student[];
    const logs = (logsRes.data ?? []) as LessonLog[];
    const payments = (paymentsRes.data ?? []) as StudentPayment[];
    const counseling = counselingRes.data ?? [];

    const logsByStudent = new Map<string, LessonLog[]>();
    for (const log of logs) {
      const arr = logsByStudent.get(log.student_id) ?? [];
      arr.push(log);
      logsByStudent.set(log.student_id, arr);
    }

    const overdueByStudent = new Map<string, number>();
    for (const p of payments) {
      if (paymentOverdue(p, today) || p.status === 'overdue') {
        overdueByStudent.set(p.student_id, (overdueByStudent.get(p.student_id) ?? 0) + 1);
      }
    }

    const pendingCounseling = new Set(counseling.map((c) => c.student_id));

    const rows: {
      academy_id: string;
      student_id: string;
      risk_level: string;
      score: number;
      reason: string;
      signals: { id: string; label: string }[];
    }[] = [];

    for (const student of students) {
      const studentLogs = logsByStudent.get(student.id) ?? [];
      const absentRecent = studentLogs
        .slice(0, 8)
        .filter((l) => l.attendance_status === 'absent').length;

      const assessment = assessRetentionRisk({
        student,
        logs: studentLogs,
        overduePayments: overdueByStudent.get(student.id) ?? 0,
        absentRecent,
        pendingCounseling: pendingCounseling.has(student.id),
      });

      rows.push({
        academy_id: academyId,
        student_id: student.id,
        risk_level: assessment.riskLevel,
        score: assessment.score,
        reason: assessment.reason,
        signals: assessment.signals,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('retention_signals').insert(rows);
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, scanned: rows.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
