'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Mode = 'parent' | 'student';

type PendingRequest = {
  id: string;
  requested_student_name: string | null;
  academy_id: string | null;
};

type Props = {
  mode: Mode;
  onSubmitted?: () => void;
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: '엄마',
  father: '아빠',
  guardian: '보호자',
};

const ERR_MAP: Record<string, string> = {
  invalid_code: '학원 코드를 찾을 수 없습니다. 다시 확인해 주세요.',
  student_name_required: '학생 이름을 입력해 주세요.',
  already_connected: '이미 연결된 학생입니다.',
  relationship_taken: '이 관계로 이미 등록된 분이 있습니다.',
  pending_exists: '이미 연결 요청이 접수되어 있습니다.',
  student_role_required: '학생 계정으로 다시 로그인해 주세요.',
  parent_role_required: '학부모 계정으로 다시 로그인해 주세요.',
};

export function ConnectStudentPanel({ mode, onSubmitted }: Props) {
  const { profile, refresh } = useAuth();
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [relationship, setRelationship] = useState<'mother' | 'father' | 'guardian'>('mother');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    void (async () => {
      const { data } = await supabase
        .from('student_connection_requests')
        .select('id, requested_student_name, academy_id')
        .eq('user_id', profile.id)
        .eq('status', 'pending');
      setPending((data as PendingRequest[]) ?? []);
      setLoadingPending(false);
    })();
  }, [profile?.id]);

  const handleSubmit = async () => {
    if (!code.trim()) { setError('학원 코드를 입력해 주세요.'); return; }
    if (!studentName.trim()) { setError(mode === 'student' ? '내 이름을 입력해 주세요.' : '자녀 이름을 입력해 주세요.'); return; }
    setSaving(true);
    setError('');

    const rel = mode === 'student' ? 'student' : relationship;
    const { data, error: rpcErr } = await supabase.rpc('submit_student_connection_request', {
      p_code: code.trim().toUpperCase(),
      p_relationship: rel,
      p_student_name: studentName.trim(),
    });

    if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }

    const result = data as { ok: boolean; error?: string; academy_name?: string };
    if (!result.ok) {
      setError(ERR_MAP[result.error ?? ''] ?? result.error ?? '요청에 실패했습니다.');
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    const academyName = result.academy_name ?? '학원';
    setSubmitted(academyName);
    setPending((prev) => [
      ...prev,
      { id: '', requested_student_name: studentName.trim(), academy_id: null },
    ]);
    onSubmitted?.();
  };

  if (loadingPending) return null;

  const isParent = mode === 'parent';
  const inputCls = isParent
    ? 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400'
    : 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400';
  const btnCls = isParent
    ? 'w-full py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
    : 'w-full py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-colors bg-amber-500 hover:bg-amber-600 disabled:opacity-50';

  return (
    <div className="space-y-4">
      {/* 대기 중인 요청 */}
      {pending.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1.5">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <i className="ri-time-line" />
            학원 승인 대기 중
          </p>
          {pending.map((r, i) => (
            <p key={i} className="text-xs text-amber-700">
              · <strong>{r.requested_student_name}</strong> — 원장이 확인 후 연결됩니다
            </p>
          ))}
          <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200">
            승인 전까지 수업 기록이 표시되지 않습니다.
          </p>
        </div>
      )}

      {/* 제출 완료 */}
      {submitted && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-xl mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">연결 요청이 접수되었습니다</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              <strong>{submitted}</strong> 원장 확인 후 수업 기록을 볼 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 입력 폼 */}
      {!submitted && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">학원 코드</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EDU-XXXX-XX"
              className={`${inputCls} font-mono uppercase`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">
              {mode === 'student' ? '내 이름 (학원 등록명)' : '자녀 이름 (학원 등록명)'}
            </label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={mode === 'student' ? '학원에 등록된 내 이름' : '학원에 등록된 자녀 이름'}
              className={inputCls}
            />
          </div>

          {isParent && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">자녀와의 관계</label>
              <div className="flex gap-2">
                {(['mother', 'father', 'guardian'] as const).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelationship(rel)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                      relationship === rel
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {RELATIONSHIP_LABELS[rel]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !code.trim() || !studentName.trim()}
            className={btnCls}
          >
            {saving ? '요청 중…' : isParent ? '자녀 연결하기' : '학원 연결하기'}
          </button>
        </div>
      )}
    </div>
  );
}
