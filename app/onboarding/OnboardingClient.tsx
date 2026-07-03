'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { roleHomePath } from '@/lib/roles';
import { cn } from '@/lib/cn';
import { BrandLogo } from '@/components/brand/BrandLogo';
import type { UserRole } from '@/types/database';

import StepProfile from './steps/StepProfile';
import StepOwnerAcademy from './steps/StepOwnerAcademy';
import StepTeacherJoin from './steps/StepTeacherJoin';
import StepParentConnect from './steps/StepParentConnect';
import StepStudentConnect from './steps/StepStudentConnect';

type StepConfig = { label: string; icon: string };

const STEPS_CONFIG: Record<UserRole, StepConfig[]> = {
  owner:   [{ label: '기본 정보', icon: 'ri-user-line' }, { label: '학원 설정', icon: 'ri-building-2-line' }],
  teacher: [{ label: '기본 정보', icon: 'ri-user-line' }, { label: '학원 참여', icon: 'ri-key-2-line' }],
  desk:    [{ label: '기본 정보', icon: 'ri-user-line' }, { label: '학원 참여', icon: 'ri-key-2-line' }],
  parent:  [{ label: '기본 정보', icon: 'ri-user-line' }, { label: '자녀 연결', icon: 'ri-parent-line' }],
  student: [{ label: '기본 정보', icon: 'ri-user-line' }, { label: '학원 연결', icon: 'ri-school-line' }],
};

const ROLE_META: Record<UserRole, {
  label: string;
  gradient: string;
  bg: string;
  benefits: string[];
  icon: string;
}> = {
  owner: {
    label: '원장',
    gradient: 'from-blue-600 to-blue-700',
    bg: 'from-blue-600 to-sky-500',
    icon: 'ri-building-4-line',
    benefits: [
      '오늘 상담·수업을 10초 안에 파악',
      'AI 브리핑으로 상담 준비 5분 완료',
      '학부모 리포트·재등록 한 Workflow',
      '강사별 운영 현황 실시간 확인',
    ],
  },
  teacher: {
    label: '강사',
    gradient: 'from-violet-600 to-violet-700',
    bg: 'from-violet-600 to-purple-500',
    icon: 'ri-user-star-line',
    benefits: [
      '오늘 수업·출결 1분 기록',
      '담당 학생 전체 현황 한눈에',
      '숙제·성적 즉시 입력',
      '학부모 메시지 채팅으로 소통',
    ],
  },
  desk: {
    label: '원무',
    gradient: 'from-slate-600 to-slate-700',
    bg: 'from-slate-600 to-slate-500',
    icon: 'ri-customer-service-2-line',
    benefits: [
      '원무 업무 화면으로 간소화',
      '수납·재등록 현황 관리',
      '학부모 연결 요청 처리',
      '학원 설정·코드 관리',
    ],
  },
  parent: {
    label: '학부모',
    gradient: 'from-emerald-600 to-emerald-700',
    bg: 'from-emerald-600 to-teal-500',
    icon: 'ri-parent-line',
    benefits: [
      '자녀 출결·숙제 실시간 확인',
      '학원 리포트 앱에서 바로 수신',
      '선생님과 채팅 소통',
      'AI가 24시간 문의 응답',
    ],
  },
  student: {
    label: '학생',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'from-amber-500 to-orange-400',
    icon: 'ri-graduation-cap-line',
    benefits: [
      '내 출결·숙제 현황 확인',
      '성적 변화 그래프로 파악',
      '수업 공지 실시간 수신',
      '선생님께 메시지 보내기',
    ],
  },
};

export default function OnboardingClient() {
  const { profile, loading, refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  const role = profile?.role ?? 'owner';
  const steps = STEPS_CONFIG[role] ?? STEPS_CONFIG.owner;
  const totalSteps = steps.length;
  const meta = ROLE_META[role] ?? ROLE_META.owner;

  useEffect(() => {
    if (!profile?.id) return;
    const saved = Number(localStorage.getItem(`onboarding_step_${profile.id}`) ?? '1');
    if (saved >= 1 && saved <= totalSteps) setStep(saved);
  }, [profile?.id, totalSteps]);

  useEffect(() => {
    if (!profile?.id) return;
    localStorage.setItem(`onboarding_step_${profile.id}`, String(step));
  }, [profile?.id, step]);

  useEffect(() => {
    if (loading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.onboarding_complete === true) {
      localStorage.removeItem(`onboarding_step_${profile.id}`);
      router.replace(roleHomePath(profile.role));
    }
  }, [loading, profile, router]);

  const completeOnboarding = async () => {
    if (!profile?.id) return;
    setCompleting(true);
    await supabase.from('users').update({ onboarding_complete: true }).eq('id', profile.id);
    localStorage.removeItem(`onboarding_step_${profile.id}`);
    await refresh();
    router.replace(roleHomePath(role));
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-sm text-slate-400">불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── LEFT PANEL (데스크톱) ─────────────────────── */}
      <aside className={cn(
        'hidden lg:flex lg:w-[380px] xl:w-[420px] flex-none flex-col bg-gradient-to-br text-white',
        meta.bg
      )}>
        {/* Logo */}
        <div className="px-10 pt-10">
          <BrandLogo href="/" variant="light" size={36} />
        </div>

        {/* Role badge + headline */}
        <div className="flex flex-1 flex-col justify-center px-10 py-12">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
            <i className={meta.icon} />
            <span className="text-sm font-semibold">{meta.label} 온보딩</span>
          </div>

          <h2 className="text-2xl font-extrabold leading-snug">
            {meta.label === '원장'
              ? '우리 학원을\n설정해 보세요'
              : meta.label === '강사' || meta.label === '원무'
              ? '학원에\n참여하세요'
              : '포털에\n연결하세요'
            }
          </h2>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            기본 정보만 입력하면 바로 사용할 수 있습니다.
          </p>

          {/* Benefits */}
          <ul className="mt-8 space-y-3">
            {meta.benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/20 text-xs">
                  <i className="ri-check-line" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* Step indicators */}
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">진행 단계</p>
            <div className="space-y-2.5">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition-all',
                    step > i + 1
                      ? 'bg-white text-emerald-600'
                      : step === i + 1
                      ? 'bg-white/30 text-white ring-2 ring-white/50'
                      : 'bg-white/10 text-white/40'
                  )}>
                    {step > i + 1 ? <i className="ri-check-line" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-sm transition-colors',
                    step === i + 1 ? 'font-semibold text-white' : step > i + 1 ? 'text-white/70' : 'text-white/40'
                  )}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 pb-8 text-xs text-white/40">
          © 2026 EduFlow · 개인정보처리방침
        </div>
      </aside>

      {/* ── RIGHT PANEL (폼) ──────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">

          {/* Mobile header */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandLogo href="/" size={32} nameClassName="font-extrabold text-slate-800" />
            <div className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r',
              meta.gradient
            )}>
              {meta.label} 온보딩
            </div>
          </div>

          {/* Step progress (mobile) */}
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s.label} className="flex flex-1 items-center gap-1">
                  <div className={cn(
                    'h-1.5 flex-1 rounded-full transition-all',
                    step > i ? `bg-gradient-to-r ${meta.gradient}` : 'bg-slate-200'
                  )} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {step} / {totalSteps} 단계 — {steps[step - 1]?.label}
            </p>
          </div>

          {/* Desktop step header */}
          <div className="mb-6 hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Step {step} of {totalSteps}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{steps[step - 1]?.label}</h1>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-7 min-h-[380px]">
            {step === 1 && <StepProfile onNext={() => setStep(2)} />}
            {step === 2 && role === 'owner'   && <StepOwnerAcademy   onNext={completeOnboarding} />}
            {step === 2 && (role === 'teacher' || role === 'desk') && <StepTeacherJoin onNext={completeOnboarding} />}
            {step === 2 && role === 'parent'  && <StepParentConnect  onNext={completeOnboarding} />}
            {step === 2 && role === 'student' && <StepStudentConnect onNext={completeOnboarding} />}
          </div>

          {/* Back + meta */}
          <div className="mt-4 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={completing}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="ri-arrow-left-line" /> 이전 단계
              </button>
            ) : (
              <span />
            )}
            <p className="text-xs text-slate-400">{step} / {totalSteps}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
