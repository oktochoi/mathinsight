import type {
  ConsultationCard,
  ConsultationFollowup,
  CounselingSession,
  LessonLog,
  ParentReport,
} from '@/types/database';
import { consultationCardPath, parentReportPath } from '@/lib/documentRoutes';
import { formatConsultationStatusLine } from '@/lib/consultationStatus';
import { ATTENDANCE_LABELS, HOMEWORK_LABELS } from '@/lib/statusLabels';

export type TimelineEntryType =
  | 'consultation_card'
  | 'parent_report'
  | 'lesson_memo'
  | 'score'
  | 'homework_missing'
  | 'attendance'
  | 'counseling_session'
  | 'followup';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  date: string;
  title: string;
  detail: string;
  href?: string;
}

export function buildStudentTimeline(
  logs: LessonLog[],
  cards: ConsultationCard[],
  reports: ParentReport[],
  followups: ConsultationFollowup[] = [],
  sessions: CounselingSession[] = []
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const c of cards) {
    const done = c.consultation_status === 'completed';
    entries.push({
      id: `card-${c.id}`,
      type: 'consultation_card',
      date: (done && c.consulted_at ? c.consulted_at : c.created_at).slice(0, 10),
      title: done ? '상담 완료' : '상담 카드 저장 (대기)',
      detail: `${c.period_start} ~ ${c.period_end} · ${formatConsultationStatusLine(c)}`,
      href: consultationCardPath(c.id),
    });
  }

  for (const r of reports) {
    entries.push({
      id: `report-${r.id}`,
      type: 'parent_report',
      date: r.created_at.slice(0, 10),
      title: '학부모 리포트 생성',
      detail: `${r.period_start} ~ ${r.period_end}`,
      href: parentReportPath(r.id),
    });
  }

  for (const f of followups) {
    entries.push({
      id: `fu-${f.id}`,
      type: 'followup',
      date: (f.due_date ?? f.created_at).slice(0, 10),
      title: f.status === 'done' ? '상담 후 확인 완료' : '상담 후 확인',
      detail: `${f.title}${f.memo ? ` · ${f.memo}` : ''}`,
    });
  }

  for (const s of sessions) {
    const done = s.status === 'completed' || s.status === 'followup_needed';
    entries.push({
      id: `session-${s.id}`,
      type: 'counseling_session',
      date: (s.completed_at ?? s.scheduled_at ?? s.created_at).slice(0, 10),
      title: done ? '상담 완료' : '상담 예정·진행',
      detail: s.title || s.summary?.slice(0, 80) || '상담 기록',
      href: `/counseling?step=${done ? 'wrapup' : 'session'}&student=${s.student_id}`,
    });
  }

  for (const l of logs) {
    if (l.attendance_status && l.attendance_status !== 'present') {
      entries.push({
        id: `att-${l.id}`,
        type: 'attendance',
        date: l.lesson_date,
        title: ATTENDANCE_LABELS[l.attendance_status] ?? l.attendance_status,
        detail: `${l.unit || '수업'} · ${ATTENDANCE_LABELS[l.attendance_status]}`,
      });
    }
    if (l.memo?.trim()) {
      entries.push({
        id: `memo-${l.id}`,
        type: 'lesson_memo',
        date: l.lesson_date,
        title: '수업 메모',
        detail: l.memo.trim(),
      });
    }
    if (l.test_score != null) {
      entries.push({
        id: `score-${l.id}`,
        type: 'score',
        date: l.lesson_date,
        title: '시험·점수 기록',
        detail: `${l.unit || '수업'} · ${l.test_score}점`,
      });
    }
    if (l.homework_status === 'missing') {
      entries.push({
        id: `hw-${l.id}`,
        type: 'homework_missing',
        date: l.lesson_date,
        title: '숙제 미제출 기록',
        detail: `${l.unit || '수업'} · ${HOMEWORK_LABELS.missing}`,
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
