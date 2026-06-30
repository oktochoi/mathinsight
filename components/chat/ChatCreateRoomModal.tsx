'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { cn } from '@/lib/cn';

type Mode = 'direct' | 'class_group';
type DirectAudience = 'parent' | 'student';

export function ChatCreateRoomModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (channelId: string) => void;
}) {
  const { students, loading: studentsLoading } = useStudents();
  const { classes, loading: classesLoading } = useClasses();
  const [mode, setMode] = useState<Mode>('direct');
  const [directAudience, setDirectAudience] = useState<DirectAudience>('parent');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleCreate = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'direct') {
        if (!studentId) {
          setError('학생을 선택해 주세요.');
          return;
        }
        const { data, error: err } = await supabase.rpc('get_or_create_direct_chat_channel', {
          p_student_id: studentId,
          p_audience: directAudience,
        });
        if (err || !data) {
          setError(err?.message ?? '1:1 채팅을 만들 수 없습니다.');
          return;
        }
        onCreated(data as string);
        onClose();
      } else {
        if (!classId) {
          setError('반을 선택해 주세요.');
          return;
        }
        const { data, error: err } = await supabase.rpc('get_or_create_class_group_chat_channel', {
          p_class_id: classId,
        });
        if (err || !data) {
          setError(err?.message ?? '반 톡방을 만들 수 없습니다.');
          return;
        }
        onCreated(data as string);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const loading = studentsLoading || classesLoading;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/30"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="fixed z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(calc(100vw-2rem),400px)] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        role="dialog"
        aria-label="새 채팅 만들기"
      >
        <header
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            새 채팅 만들기
          </p>
          <button type="button" onClick={onClose} className="text-lg" style={{ color: 'var(--app-ink-3)' }}>
            <i className="ri-close-line" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {(
              [
                ['direct', '1:1 채팅'],
                ['class_group', '반 톡방'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  'flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors',
                  mode === id ? 'app-badge-info border-[var(--app-accent-border)]' : ''
                )}
                style={
                  mode === id
                    ? undefined
                    : { borderColor: 'var(--app-border)', color: 'var(--app-ink-3)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-xs text-center py-6" style={{ color: 'var(--app-ink-3)' }}>
              불러오는 중…
            </p>
          ) : mode === 'direct' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {(
                  [
                    ['parent', '학부모 1:1'],
                    ['student', '학생 1:1'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDirectAudience(id)}
                    className={cn(
                      'flex-1 text-[11px] font-semibold py-2 rounded-xl border transition-colors',
                      directAudience === id ? 'app-badge-info border-[var(--app-accent-border)]' : ''
                    )}
                    style={
                      directAudience === id
                        ? undefined
                        : { borderColor: 'var(--app-border)', color: 'var(--app-ink-3)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div>
              <label className="app-label block mb-1.5">학생 선택</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <option value="">학생을 선택하세요</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.grade ? ` · ${s.grade}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--app-ink-4)' }}>
                학부모·학생 대화함은 분리됩니다. 반 톡방은 학생·선생님만 이용합니다.
              </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="app-label block mb-1.5">반 선택</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <option value="">반을 선택하세요</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.grade ? ` · ${c.grade}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--app-ink-4)' }}>
                반 학생·학부모가 참여하는 단체 톡방입니다.
              </p>
            </div>
          )}

          {error && <p className="text-xs app-text-danger">{error}</p>}
        </div>

        <footer
          className="px-4 py-3 flex gap-2 justify-end"
          style={{ borderTop: '1px solid var(--app-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ color: 'var(--app-ink-3)' }}
          >
            취소
          </button>
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => void handleCreate()}
            className="text-xs font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50"
            style={{ background: 'var(--app-accent)' }}
          >
            {busy ? '만드는 중…' : '채팅방 만들기'}
          </button>
        </footer>
      </div>
    </>
  );
}
