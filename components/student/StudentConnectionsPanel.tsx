'use client';

import {
  isParentLinked,
  isStudentPortalLinked,
  studentParentEmail,
  studentPortalEmail,
} from '@/lib/studentPortal';
import type { Student } from '@/types/database';

type Props = {
  student: Student;
};

/** 학생 상세 — 이메일 연결 상태 */
export function StudentConnectionsPanel({ student }: Props) {
  const parentEmail = studentParentEmail(student);
  const studentEmail = studentPortalEmail(student);
  const parentOk = isParentLinked(student);
  const studentOk = isStudentPortalLinked(student);

  return (
    <div className="mt-4 rounded-xl bg-white/10 border border-white/20 px-4 py-4 text-xs space-y-3">
      <p className="text-slate-400">
        Students에서 학부모·학생 가입 이메일을 입력해 저장하면 연결됩니다.
      </p>

      <div className="space-y-2 text-slate-300">
        <p className="font-semibold text-slate-200">학부모</p>
        <p>{parentEmail || '—'}</p>
        <p className={parentOk ? 'text-emerald-300' : 'text-amber-200'}>
          {parentOk ? '✓ 연결됨' : parentEmail ? '가입 후 다시 저장하면 연결됩니다' : '이메일 미입력'}
        </p>

        <p className="font-semibold text-slate-200 pt-1">학생</p>
        <p>{studentEmail || '—'}</p>
        <p className={studentOk ? 'text-emerald-300' : 'text-amber-200'}>
          {studentOk ? '✓ 연결됨' : studentEmail ? '가입 후 다시 저장하면 연결됩니다' : '이메일 미입력'}
        </p>
      </div>
    </div>
  );
}
