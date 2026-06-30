'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { peekPendingAcademyCode, clearPendingAcademyCode } from '@/lib/academyCodeStorage';
import { formatPhoneDisplay, isValidPhoneKr, normalizePhoneKr } from '@/lib/phone';
import {
  confirmPortalLink,
  portalLinkErrorMessage,
  previewPortalLink,
  type PortalMatchParent,
  type PortalMatchStudent,
} from '@/lib/portalPhoneLink';
import { cn } from '@/lib/cn';

type Mode = 'parent' | 'student';

type Props = {
  mode: Mode;
  initialAcademyCode?: string;
  onLinked?: () => void | Promise<void>;
};

type Step = 'code' | 'confirm';

export function PhonePortalConnect({ mode, initialAcademyCode = '', onLinked }: Props) {
  const router = useRouter();
  const { profile, refresh } = useAuth();
  const [step, setStep] = useState<Step>('code');
  const [academyCode, setAcademyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    academyName: string;
    academyCode: string;
    matches: PortalMatchStudent[] | PortalMatchParent[];
  } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const pending = initialAcademyCode || peekPendingAcademyCode();
    if (pending) setAcademyCode(pending.toUpperCase());
  }, [initialAcademyCode]);

  const verifiedPhone = normalizePhoneKr(profile?.phone ?? '');

  const handleLookup = async () => {
    setError('');
    if (!academyCode.trim()) {
      setError('학원 코드를 입력해 주세요.');
      return;
    }
    if (!isValidPhoneKr(verifiedPhone)) {
      setError('가입 시 인증한 휴대폰 번호가 없습니다. 다시 로그인해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const result = await previewPortalLink(academyCode, verifiedPhone, mode);
      if (!result.ok) {
        setError(portalLinkErrorMessage(result.error) + (result.detail ? ` ${result.detail}` : ''));
        return;
      }
      setPreview({
        academyName: result.academy_name,
        academyCode: result.academy_code,
        matches: result.matches,
      });
      if (mode === 'student' && result.matches.length === 1) {
        setSelectedStudentId((result.matches[0] as PortalMatchStudent).student_id);
      }
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      setStep('code');
      setPreview(null);
      return;
    }
    if (!preview) return;
    if (mode === 'student' && !selectedStudentId) {
      setError('연결할 학생을 선택해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmPortalLink({
        academyCode: preview.academyCode,
        phone: verifiedPhone,
        mode,
        studentId: selectedStudentId ?? undefined,
      });
      if (!result.ok) {
        setError(result.error ?? '연결 실패');
        return;
      }
      clearPendingAcademyCode();
      await refresh();
      toast.success('학원과 연결되었습니다.');
      if (onLinked) {
        await onLinked();
      } else {
        router.replace(mode === 'student' ? '/student' : '/parent');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isValidPhoneKr(verifiedPhone)) {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        휴대폰 인증 정보가 없습니다. 로그아웃 후 다시 가입해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading && step === 'confirm' && (
        <p className="text-sm text-center text-slate-500 py-2">연결 중…</p>
      )}

      {step === 'code' && (
        <>
          <p className="text-xs text-slate-500">
            가입 번호 <strong>{formatPhoneDisplay(verifiedPhone)}</strong>로 학원 등록 정보를 찾습니다.
          </p>
          <label className="text-xs font-medium text-slate-600">학원 코드</label>
          <input
            className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase"
            value={academyCode}
            onChange={(e) => setAcademyCode(e.target.value.toUpperCase())}
            placeholder="HAN823"
          />
          <button
            type="button"
            disabled={loading}
            className="app-btn app-btn-primary w-full disabled:opacity-50"
            onClick={() => void handleLookup()}
          >
            {loading ? '검색 중…' : mode === 'student' ? '내 정보 찾기' : '자녀 정보 찾기'}
          </button>
        </>
      )}

      {step === 'confirm' && preview && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
            <p className="text-sm font-semibold">{preview.academyName}</p>
            {mode === 'student'
              ? (preview.matches as PortalMatchStudent[]).map((m) => (
                  <label
                    key={m.student_id}
                    className={cn(
                      'block rounded-lg border p-3 cursor-pointer bg-white',
                      selectedStudentId === m.student_id && 'border-indigo-400'
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={selectedStudentId === m.student_id}
                      onChange={() => setSelectedStudentId(m.student_id)}
                    />
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">
                      {m.grade}
                      {m.class_name ? ` · ${m.class_name}` : ''}
                    </p>
                  </label>
                ))
              : (preview.matches as PortalMatchParent[]).map((m) => (
                  <div key={m.student_id} className="rounded-lg border bg-white p-3">
                    <p className="font-medium">{m.student_name}</p>
                    <p className="text-xs text-slate-500">
                      {m.grade}
                      {m.class_name ? ` · ${m.class_name}` : ''}
                    </p>
                  </div>
                ))}
            <p className="text-sm">이 정보가 맞습니까?</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="app-btn app-btn-secondary flex-1" onClick={() => void handleConfirm(false)}>
              아닙니다
            </button>
            <button
              type="button"
              className="app-btn app-btn-primary flex-1"
              disabled={loading}
              onClick={() => void handleConfirm(true)}
            >
              맞습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
