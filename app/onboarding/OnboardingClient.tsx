'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { roleHomePath } from '@/lib/roles';
import { cn } from '@/lib/cn';
import type { UserRole } from '@/types/database';

import StepProfile from './steps/StepProfile';
import StepOwnerAcademy from './steps/StepOwnerAcademy';
import StepTeacherJoin from './steps/StepTeacherJoin';
import StepParentConnect from './steps/StepParentConnect';
import StepStudentConnect from './steps/StepStudentConnect';

type StepConfig = { label: string };

const STEPS_CONFIG: Record<UserRole, StepConfig[]> = {
  owner:   [{ label: '기본 정보' }, { label: '학원 설정' }],
  teacher: [{ label: '기본 정보' }, { label: '학원 참여' }],
  desk:    [{ label: '기본 정보' }, { label: '학원 참여' }],
  parent:  [{ label: '기본 정보' }, { label: '자녀 연결' }],
  student: [{ label: '기본 정보' }, { label: '학원 연결' }],
};

const ROLE_LABELS: Record<UserRole, string> = {
  owner: '원장',
  teacher: '강사',
  desk: '원무',
  parent: '학부모',
  student: '학생',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner:   'from-blue-600 to-blue-700',
  teacher: 'from-violet-600 to-violet-700',
  desk:    'from-slate-600 to-slate-700',
  parent:  'from-emerald-600 to-emerald-700',
  student: 'from-amber-500 to-amber-600',
};

export default function OnboardingClient() {
  const { profile, loading, refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }
    // 이미 온보딩 완료한 경우 홈으로
    if (profile.onboarding_complete === true) {
      router.replace(roleHomePath(profile.role));
    }
  }, [loading, profile, router]);

  const role = profile?.role ?? 'owner';
  const steps = STEPS_CONFIG[role] ?? STEPS_CONFIG.owner;
  const totalSteps = steps.length;

  const completeOnboarding = async () => {
    if (!profile?.id) return;
    setCompleting(true);
    await supabase
      .from('users')
      .update({ onboarding_complete: true })
      .eq('id', profile.id);
    await refresh();
    router.replace(roleHomePath(role));
  };

  const handleStep1Next = () => setStep(2);

  const handleStep2Next = async () => {
    await completeOnboarding();
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-slate-400">불러오는 중…</p>
      </div>
    );
  }

  const gradient = ROLE_COLORS[role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-semibold mb-3`}>
            <i className="ri-user-line" />
            {ROLE_LABELS[role]} 온보딩
          </div>
          <h1 className="text-2xl font-bold text-slate-900">EduFlow 시작하기</h1>
          <p className="text-sm text-slate-500 mt-1">기본 정보만 입력하면 바로 사용할 수 있습니다.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-6 px-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    step > i + 1
                      ? `bg-gradient-to-br ${gradient} text-white`
                      : step === i + 1
                        ? `bg-gradient-to-br ${gradient} text-white ring-4 ring-blue-100`
                        : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {step > i + 1 ? <i className="ri-check-line" /> : i + 1}
                </div>
                <span className={cn('text-[10px] mt-1 font-medium whitespace-nowrap', step === i + 1 ? 'text-slate-700' : 'text-slate-400')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-16 h-0.5 mx-2 mb-4 transition-colors', step > i + 1 ? `bg-blue-500` : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>

        {/* 스텝 카드 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[360px]">
          {step === 1 && <StepProfile onNext={handleStep1Next} />}

          {step === 2 && role === 'owner' && (
            <StepOwnerAcademy onNext={handleStep2Next} />
          )}
          {step === 2 && (role === 'teacher' || role === 'desk') && (
            <StepTeacherJoin onNext={handleStep2Next} />
          )}
          {step === 2 && role === 'parent' && (
            <StepParentConnect onNext={handleStep2Next} />
          )}
          {step === 2 && role === 'student' && (
            <StepStudentConnect onNext={handleStep2Next} />
          )}
        </div>

        {/* 이전 버튼 */}
        {step > 1 && (
          <div className="flex justify-start mt-3">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={completing}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← 이전
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          {step} / {totalSteps} 단계
        </p>
      </div>
    </div>
  );
}
