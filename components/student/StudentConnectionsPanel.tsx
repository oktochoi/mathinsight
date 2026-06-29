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
  variant?: 'dark' | 'light';
};

/** 학생 상세 — 이메일 연결 상태 */
export function StudentConnectionsPanel({ student, variant = 'dark' }: Props) {
  const parentEmail = studentParentEmail(student);
  const studentEmail = studentPortalEmail(student);
  const parentOk = isParentLinked(student);
  const studentOk = isStudentPortalLinked(student);

  const lightStyle = {
    border: '1px solid var(--app-border)',
    background: 'var(--app-surface-2)',
  };
  const darkStyle = {
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
  };

  return (
    <div
      className="mt-4 rounded-xl px-4 py-4 text-xs space-y-3"
      style={variant === 'light' ? lightStyle : darkStyle}
    >
      <p style={{ color: variant === 'light' ? 'var(--app-ink-3)' : 'rgba(255,255,255,0.6)' }}>
        Students에서 학부모·학생 가입 이메일을 입력해 저장하면 연결됩니다.
      </p>

      <div style={{ color: variant === 'light' ? 'var(--app-ink-2)' : 'rgba(255,255,255,0.75)' }}>
        <p className="font-semibold" style={{ color: variant === 'light' ? 'var(--app-ink)' : 'rgba(255,255,255,0.9)' }}>학부모</p>
        <p>{parentEmail || '—'}</p>
        <p className={parentOk ? (variant === 'light' ? 'text-emerald-700' : 'text-emerald-300') : variant === 'light' ? 'text-amber-700' : 'text-amber-200'}>
          {parentOk ? '✓ 연결됨' : parentEmail ? '가입 후 다시 저장하면 연결됩니다' : '이메일 미입력'}
        </p>

        <p className="font-semibold pt-1" style={{ color: variant === 'light' ? 'var(--app-ink)' : 'rgba(255,255,255,0.9)' }}>학생</p>
        <p>{studentEmail || '—'}</p>
        <p className={studentOk ? (variant === 'light' ? 'text-emerald-700' : 'text-emerald-300') : variant === 'light' ? 'text-amber-700' : 'text-amber-200'}>
          {studentOk ? '✓ 연결됨' : studentEmail ? '가입 후 다시 저장하면 연결됩니다' : '이메일 미입력'}
        </p>
      </div>
    </div>
  );
}
