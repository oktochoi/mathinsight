'use client';

import Link from 'next/link';
import type { Student } from '@/types/database';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/statusLabels';
import {
  isParentLinked,
  isStudentPortalLinked,
  studentParentEmail,
  studentPortalEmail,
} from '@/lib/studentPortal';
import StudentDetail from '@/app/(app)/students/[id]/StudentDetail';

export function StudentsByStudentView({
  students,
  selectedId,
  onSelect,
}: {
  students: Student[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = students.find((s) => s.id === selectedId) ?? students[0];

  if (students.length === 0) {
    return <p className="text-sm text-slate-500 p-6">등록된 학생이 없습니다.</p>;
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-0 min-h-[480px] border-t border-slate-100">
      <ul className="border-r border-slate-100 divide-y divide-slate-50 max-h-[70vh] overflow-y-auto">
        {students.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer ${
                (selectedId || selected?.id) === s.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
              }`}
            >
              <p className="font-semibold text-sm text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {s.grade} · {(s.classes as { name?: string })?.name ?? '반 없음'}
              </p>
              <span
                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[s.status]}`}
              >
                {STATUS_LABELS[s.status]}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
        {selected && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>
                학부모: {studentParentEmail(selected) || '—'}{' '}
                {isParentLinked(selected) ? (
                  <span className="text-emerald-600">연결됨</span>
                ) : studentParentEmail(selected) ? (
                  <span className="text-amber-600">미연결</span>
                ) : null}
              </span>
              <span>·</span>
              <span>
                학생 계정: {studentPortalEmail(selected) || '—'}{' '}
                {isStudentPortalLinked(selected) ? (
                  <span className="text-emerald-600">연결됨</span>
                ) : studentPortalEmail(selected) ? (
                  <span className="text-amber-600">미연결</span>
                ) : null}
              </span>
              <Link
                href={`/students?edit=${selected.id}`}
                className="ml-auto text-blue-600 hover:underline"
              >
                정보 수정
              </Link>
            </div>
            <StudentDetail studentId={selected.id} embed />
          </>
        )}
      </div>
    </div>
  );
}
