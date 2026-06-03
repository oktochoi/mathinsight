'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import {
  PARENT_RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  canSubmitRelationship,
  connectionRequestErrorMessage,
  isValidConnectionCodeFormat,
  normalizeConnectionCode,
} from '@/lib/studentConnection';
import type { ConnectionRelationship } from '@/types/database';

type Props = {
  mode: 'parent' | 'student';
  onSuccess?: () => void;
};

export function ConnectWithCodeForm({ mode, onSuccess }: Props) {
  const { profile } = useAuth();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [relationship, setRelationship] = useState<ConnectionRelationship>(
    mode === 'student' ? 'student' : 'mother'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const title = mode === 'parent' ? '학원에 연결하기' : '학원에 연결하기';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalized = normalizeConnectionCode(code);
    if (!isValidConnectionCodeFormat(normalized)) {
      setError('코드 형식: EDU-XXXX-00 (예: EDU-KM42-91)');
      return;
    }

    const name = studentName.trim();
    if (!name) {
      setError('학원에 등록된 학생 이름을 입력해 주세요.');
      return;
    }

    if (!canSubmitRelationship(profile?.role, relationship)) {
      setError(mode === 'parent' ? '학부모 계정으로 로그인해 주세요.' : '학생 계정으로 로그인해 주세요.');
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('submit_student_connection_request', {
      p_code: normalized,
      p_relationship: relationship,
      p_student_name: name,
    });
    setLoading(false);

    const result = data as {
      ok?: boolean;
      error?: string;
      academy_name?: string;
      student_name?: string;
      needs_student_pick?: boolean;
    } | null;

    if (rpcError || !result?.ok) {
      setError(connectionRequestErrorMessage(result?.error));
      return;
    }

    bumpDataVersion();
    const academyLabel = result.academy_name ? `「${result.academy_name}」` : '학원';
    const pickNote = result.needs_student_pick
      ? ' 동명이인이 있을 수 있어 원장이 학생을 지정한 뒤 승인합니다.'
      : '';
    setMessage(
      `${academyLabel}에 「${result.student_name ?? name}」 연결 요청을 보냈습니다. 원장 승인 후 이용할 수 있습니다.${pickNote}`
    );
    setCode('');
    setStudentName('');
    onSuccess?.();
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-indigo-100 shadow-sm space-y-4 max-w-md w-full">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        학원에서 받은 <strong>학원 연결 코드</strong>와 <strong>학생 이름</strong>을 입력하세요. 원장이
        승인하면 수업·리포트를 볼 수 있습니다.
      </p>

      {message && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            학원 연결 코드
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EDU-KM42-91"
            className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono tracking-wider"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {mode === 'parent' ? '자녀 이름 (학원 등록명)' : '본인 이름 (학원 등록명)'}
          </label>
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="예: 박서연"
            className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            관계
          </label>
          {mode === 'student' ? (
            <p className="mt-2 text-sm text-slate-700">{RELATIONSHIP_LABELS.student}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PARENT_RELATIONSHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelationship(r)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    relationship === r
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {RELATIONSHIP_LABELS[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full soft-btn-primary disabled:opacity-50 cursor-pointer"
        >
          {loading ? '요청 중...' : '연결 요청 보내기'}
        </button>
      </form>
    </div>
  );
}
