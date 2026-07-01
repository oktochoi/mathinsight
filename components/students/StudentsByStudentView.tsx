'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ConnectionRelationship, Student } from '@/types/database';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/statusLabels';
import { isParentLinked, isStudentPortalLinked } from '@/lib/studentPortal';
import StudentDetail from '@/app/(app)/students/[id]/StudentDetail';
import { cn } from '@/lib/cn';
import {
  readStudentsSidebarScroll,
  saveStudentsSidebarScroll,
} from '@/lib/studentsListScroll';

export function StudentsByStudentView({
  students,
  selectedId,
  onSelect,
  connectionsByStudent,
}: {
  students: Student[];
  selectedId: string;
  onSelect: (id: string) => void;
  connectionsByStudent?: Map<string, { relationship: ConnectionRelationship }[]>;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const selected = students.find((s) => s.id === selectedId) ?? students[0];
  const activeId = selectedId || selected?.id;
  const selectedConnections = selected ? connectionsByStudent?.get(selected.id) : undefined;

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const y = readStudentsSidebarScroll();
    if (y != null && y > 0) {
      requestAnimationFrame(() => {
        el.scrollTop = y;
      });
    }
    const onScroll = () => saveStudentsSidebarScroll(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [students.length]);

  if (students.length === 0) {
    return <p className="text-sm text-slate-500 p-6">등록된 학생이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:min-h-[480px] border-t border-slate-100">
      <div
        ref={sidebarRef}
        className="lg:border-r border-slate-100 lg:max-h-[70vh] lg:overflow-y-auto"
      >
        <p className="lg:hidden px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
          학생 선택
        </p>
        <ul className="flex lg:flex-col gap-0 overflow-x-auto lg:overflow-x-visible overscroll-x-contain snap-x lg:snap-none border-b lg:border-b-0 border-slate-100">
          {students.map((s) => (
            <li key={s.id} className="shrink-0 lg:shrink lg:w-full snap-start">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors min-h-[52px] lg:min-h-0',
                  activeId === s.id
                    ? 'bg-blue-50 border-b-2 lg:border-b-0 lg:border-l-2 border-blue-600'
                    : 'border-b-2 lg:border-b-0 lg:border-l-2 border-transparent'
                )}
              >
                <p className="font-semibold text-sm text-slate-900 whitespace-nowrap lg:whitespace-normal">
                  {s.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap lg:whitespace-normal">
                  {s.grade} · {(s.classes as { name?: string })?.name ?? '반 없음'}
                </p>
                <span
                  className={cn(
                    'inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border',
                    STATUS_STYLES[s.status]
                  )}
                >
                  {STATUS_LABELS[s.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 sm:p-5 space-y-4 lg:overflow-y-auto lg:max-h-[70vh] min-w-0">
        {selected && (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center text-xs text-slate-600">
              <div className="space-y-1 min-w-0">
                <p>
                  학부모 연결:{' '}
                  {isParentLinked(selected, selectedConnections) ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </p>
                <p>
                  학생 연결:{' '}
                  {isStudentPortalLinked(selected, selectedConnections) ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </p>
              </div>
              <Link
                href={`/students?edit=${selected.id}`}
                className="sm:ml-auto text-blue-600 hover:underline shrink-0 min-h-[44px] flex items-center"
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
