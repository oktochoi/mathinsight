'use client';

import Link from 'next/link';
import { CONTACT_EMAIL } from '@/lib/brand';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export function SignupForm() {
  const subject = encodeURIComponent('EduFlow 도입 문의');
  const body = encodeURIComponent(
    '안녕하세요.\n\n학원명:\n학생 수:\n문의 내용:\n'
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <AuthPageScaffold>
      <AuthFormCard title="도입 문의" subtitle="EduFlow 도입을 검토 중이신가요?">
        {PROMO_ALL_FREE.active && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-green-800">
              지금 도입하시면 행사 기간 중 전 기능 무료
            </p>
            <p className="mt-1 text-xs text-green-600">
              카드 등록 없이 모든 플랜을 이용하실 수 있습니다
            </p>
          </div>
        )}

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          현재 회원가입은 도입 상담 후 안내드리고 있습니다.
          <br />
          아래 버튼을 눌러 메일을 보내주시면 1~2 영업일 내 회신드리겠습니다.
        </p>

        <a
          href={mailto}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <i className="ri-mail-send-line text-lg" />
          도입 문의 메일 보내기
        </a>

        <p className="mt-4 text-center text-xs text-slate-400">
          또는 직접 메일을 보내주세요:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>

        <hr className="my-5 border-slate-100" />

        <p className="text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="auth-link">
            로그인
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
