'use client';

import { useMemo, useState } from 'react';
import { useAcademyConnectionRequests } from '@/hooks/useStudentConnections';
import { useStudents } from '@/hooks/useStudents';
import { RELATIONSHIP_LABELS, connectionRequestErrorMessage } from '@/lib/studentConnection';
import type { ConnectionRelationship } from '@/types/database';
import { ErrorBanner, PageLoader } from '@/components/ui/DataStates';

export function ConnectionRequestsSection() {
  const { requests, loading, error, review } = useAcademyConnectionRequests();
  const { students } = useStudents();
  const [actingId, setActingId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<Record<string, string>>({});

  const studentOptions = useMemo(
    () => students.map((s) => ({ id: s.id, label: `${s.name} · ${s.grade}` })),
    [students]
  );

  const handleReview = async (id: string, approve: boolean, presetStudentId?: string | null) => {
    setActingId(id);
    const studentId = approve ? presetStudentId ?? assignStudentId[id] ?? null : null;
    const { error: err } = await review(id, approve, studentId || undefined);
    setActingId(null);
    if (err) alert(connectionRequestErrorMessage(err));
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
      <h3 className="text-sm font-bold text-slate-900">연결 요청</h3>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">대기 중인 연결 요청이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => {
            const displayName =
              req.requested_student_name ??
              (req.student as { name?: string })?.name ??
              '이름 미입력';
            const matchedStudentId = req.student_id;
            const needsPick = !matchedStudentId;

            return (
              <li
                key={req.id}
                className="flex flex-col gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/80"
              >
                <div>
                  <p className="font-semibold text-slate-900">{displayName}</p>
                  <p className="text-sm text-indigo-600 mt-0.5">
                    {RELATIONSHIP_LABELS[req.relationship as ConnectionRelationship]} ·{' '}
                    {req.user?.name ?? req.user?.email ?? '계정'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{req.user?.email}</p>
                  {matchedStudentId && (
                    <p className="text-xs text-emerald-700 mt-1">등록명 일치 — 바로 승인 가능</p>
                  )}
                  {needsPick && (
                    <p className="text-xs text-amber-700 mt-1">
                      동명이인 가능 — 승인 시 학생을 선택해 주세요.
                    </p>
                  )}
                </div>

                {needsPick && (
                  <select
                    value={assignStudentId[req.id] ?? ''}
                    onChange={(e) =>
                      setAssignStudentId((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">연결할 학생 선택</option>
                    {studentOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={actingId === req.id || (needsPick && !assignStudentId[req.id])}
                    onClick={() => void handleReview(req.id, true, matchedStudentId)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={actingId === req.id}
                    onClick={() => void handleReview(req.id, false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    거절
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
