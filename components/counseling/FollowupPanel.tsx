'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useCounselingSessions } from '@/hooks/useCounselingSessions';
import { EmptyState } from '@/components/ui/DataStates';

export function FollowupPanel() {
  const { followups, loading, addFollowup, updateStatus } = useConsultationFollowups();
  const { sessions, updateSession } = useCounselingSessions();
  const [newTitle, setNewTitle] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingFollowups = followups.filter((f) => f.status === 'pending');
  const followupSessions = sessions.filter((s) => s.status === 'followup_needed');

  const studentOptions = [
    ...new Map(
      sessions.map((s) => [s.student_id, s.students?.name ?? '학생'])
    ).entries(),
  ];

  const handleAdd = async () => {
    if (!newTitle.trim() || !newStudentId) return;
    setBusy(true);
    await addFollowup({
      student_id: newStudentId,
      title: newTitle.trim(),
      memo: '',
    });
    setNewTitle('');
    setBusy(false);
  };

  const resolveSession = async (sessionId: string) => {
    setBusy(true);
    await updateSession(sessionId, { status: 'completed' });
    setBusy(false);
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-4">후속 항목 불러오는 중…</p>;
  }

  const empty = pendingFollowups.length === 0 && followupSessions.length === 0;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-violet-900">후속 조치</h2>
        <p className="text-xs text-violet-800/80 mt-1">
          상담 완료 시 체크리스트 항목이 여기에 자동 등록됩니다. 완료하면 목록에서 사라집니다.
        </p>
      </div>

      {empty ? (
        <EmptyState
          title="처리할 후속 조치가 없습니다"
          description="상담 완료 시 체크리스트에 남긴 항목이 여기 표시됩니다."
        />
      ) : (
        <div className="space-y-4">
          {followupSessions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">후속 필요 상담</p>
              <ul className="space-y-2">
                {followupSessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{s.students?.name}</p>
                      <p className="text-xs text-slate-500">{s.title}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void resolveSession(s.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        처리 완료
                      </button>
                      <Link
                        href={`/counseling?step=session&student=${s.student_id}`}
                        className="text-xs px-2.5 py-1 rounded-lg bg-violet-600 text-white"
                      >
                        상담 열기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendingFollowups.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">확인 항목</p>
              <ul className="space-y-2">
                {pendingFollowups.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      disabled={busy}
                      className="mt-1"
                      onChange={() => void updateStatus(f.id, 'done')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{f.title}</p>
                      {f.memo && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{f.memo}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {f.due_date ? `기한 ${f.due_date}` : '기한 없음'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-violet-200/60 space-y-2">
        <p className="text-xs font-semibold text-slate-600">수동 추가</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={newStudentId}
            onChange={(e) => setNewStudentId(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm min-w-[120px]"
          >
            <option value="">학생</option>
            {studentOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="확인할 내용"
            className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={busy || !newTitle.trim() || !newStudentId}
            onClick={() => void handleAdd()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
