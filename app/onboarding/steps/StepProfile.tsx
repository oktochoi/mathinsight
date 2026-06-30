'use client';

import { UserProfileForm } from '@/components/profile/UserProfileForm';
import { useAuth } from '@/context/AuthContext';

type Props = { onNext: () => void };

export default function StepProfile({ onNext }: Props) {
  const { profile } = useAuth();
  const isStudent = profile?.role === 'student';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">기본 정보</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isStudent
            ? '학교·학년을 입력하면 학원 연결이 더 수월합니다. 설정에서 언제든 바꿀 수 있습니다.'
            : '언제든지 설정에서 수정할 수 있습니다.'}
        </p>
      </div>
      <UserProfileForm
        submitLabel="다음 →"
        showStudentFields={isStudent}
        onSaved={onNext}
      />
    </div>
  );
}
