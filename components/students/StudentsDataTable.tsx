'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ColumnDef, SortingFn } from '@tanstack/react-table';
import { DataTable } from '@/components/data-ui/DataTable';
import { StatusBadge } from '@/components/data-ui/StatusBadge';
import { assessStudentRisk } from '@/lib/studentRisk';
import { ATTENDANCE_LABELS, HOMEWORK_LABELS } from '@/lib/statusLabels';
import { saveStudentsPageScroll } from '@/lib/studentsListScroll';
import type { ConsultationFollowup, LessonLog, Student } from '@/types/database';

export type StudentRow = Student & {
  logs: LessonLog[];
  followups: ConsultationFollowup[];
  pendingConsultations: number;
};

function latestAttendance(logs: LessonLog[]) {
  const log = logs[0];
  if (!log) return '—';
  return ATTENDANCE_LABELS[log.attendance_status] ?? '—';
}

function latestHomework(logs: LessonLog[]) {
  const log = logs[0];
  if (!log) return '—';
  return HOMEWORK_LABELS[log.homework_status] ?? '—';
}

function latestScore(logs: LessonLog[]) {
  const score = logs.find((l) => l.test_score != null)?.test_score;
  return score != null ? `${score}점` : '—';
}

function latestScoreNum(logs: LessonLog[]): number {
  return logs.find((l) => l.test_score != null)?.test_score ?? -1;
}

const scoreSort: SortingFn<StudentRow> = (rowA, rowB) => {
  return latestScoreNum(rowA.original.logs) - latestScoreNum(rowB.original.logs);
};

function managementTone(kind: string): 'success' | 'warning' | 'danger' | 'ai' | 'neutral' {
  if (kind === 'consultation') return 'ai';
  if (kind === 'makeup' || kind === 'attention') return 'warning';
  if (kind === 'recovering') return 'success';
  return 'success';
}


export function StudentsDataTable({
  students,
  logsByStudent,
  followupsByStudent,
  pendingCardsByStudent,
  loading,
  gradeFilter,
  classFilter,
  toolbar,
  onWithdraw,
  onEdit,
}: {
  students: Student[];
  logsByStudent: Map<string, LessonLog[]>;
  followupsByStudent: Map<string, ConsultationFollowup[]>;
  pendingCardsByStudent: Map<string, number>;
  loading?: boolean;
  gradeFilter?: string;
  classFilter?: string;
  toolbar?: React.ReactNode;
  onWithdraw?: (id: string, name: string) => void;
  onEdit?: (student: Student) => void;
}) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<StudentRow, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: '학생명',
      cell: ({ row }) => (
        <Link
          href={`/students/${row.original.id}`}
          className="font-semibold text-slate-900 hover:text-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'class',
      header: '반',
      accessorFn: (row) => (row.classes as { name?: string })?.name ?? '—',
      cell: ({ getValue }) => <span className="text-slate-600">{String(getValue())}</span>,
    },
    {
      id: 'grade',
      accessorKey: 'grade',
      header: '학년',
      cell: ({ getValue }) => <span className="text-slate-600">{String(getValue())}</span>,
    },
    {
      id: 'attendance',
      header: '최근 출석',
      accessorFn: (row) => latestAttendance(row.logs),
      cell: ({ getValue }) => <span className="text-sm">{String(getValue())}</span>,
    },
    {
      id: 'homework',
      header: '숙제 상태',
      accessorFn: (row) => latestHomework(row.logs),
      cell: ({ getValue }) => {
        const v = String(getValue());
        const tone = v.includes('미제출') ? 'danger' : v.includes('제출') ? 'success' : 'neutral';
        return <StatusBadge label={v} tone={tone} size="sm" />;
      },
    },
    {
      id: 'score',
      header: '최근 점수',
      accessorFn: (row) => latestScore(row.logs),
      sortingFn: scoreSort,
      cell: ({ getValue }) => (
        <span className="font-medium tabular-nums text-slate-800">{String(getValue())}</span>
      ),
    },
    {
      id: 'management',
      header: '관리 상태',
      accessorFn: (row) => {
        const risk = assessStudentRisk(row.logs, { followups: row.followups });
        return risk.kindLabel;
      },
      cell: ({ row, getValue }) => {
        const risk = assessStudentRisk(row.original.logs, { followups: row.original.followups });
        return (
          <StatusBadge label={String(getValue())} tone={managementTone(risk.kind)} size="sm" dot />
        );
      },
    },
    {
      id: 'actions',
      header: '작업',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.original)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
            >
              수정
            </button>
          )}
          {onWithdraw && row.original.enrollment_status !== 'withdrawn' && row.original.enrollment_status !== 'graduated' && (
            <button
              type="button"
              onClick={() => onWithdraw(row.original.id, row.original.name)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium hidden sm:inline"
            >
              퇴원
            </button>
          )}
        </div>
      ),
    },
  ], [onWithdraw, onEdit]);

  const rows = useMemo<StudentRow[]>(() => {
    return students.map((s) => ({
      ...s,
      logs: logsByStudent.get(s.id) ?? [],
      followups: followupsByStudent.get(s.id) ?? [],
      pendingConsultations: pendingCardsByStudent.get(s.id) ?? 0,
    }));
  }, [students, logsByStudent, followupsByStudent, pendingCardsByStudent]);

  const filtered = useMemo(() => {
    let list = rows;
    if (gradeFilter && gradeFilter !== '전체') {
      list = list.filter((s) => s.grade === gradeFilter);
    }
    if (classFilter && classFilter !== '전체') {
      list = list.filter((s) => s.class_id === classFilter);
    }
    return list;
  }, [rows, gradeFilter, classFilter]);

  return (
    <DataTable
      data={filtered}
      columns={columns}
      loading={loading}
      searchPlaceholder="학생 이름 검색…"
      pageSize={12}
      getRowId={(row) => row.id}
      emptyTitle="학생이 없습니다"
      emptyDescription="반을 추가한 뒤 학생을 등록해 보세요."
      toolbar={toolbar}
      onRowClick={(row) => {
        saveStudentsPageScroll(window.scrollY);
        router.push(`/students/${row.id}`);
      }}
    />
  );
}
