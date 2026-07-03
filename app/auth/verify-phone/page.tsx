import { PhoneLinkWizard } from '@/components/auth/PhoneLinkWizard';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

export default function VerifyPhonePage() {
  return (
    <AuthPageScaffold>
      <AuthFormCard title="휴대폰 인증" subtitle="계속하려면 휴대폰 번호를 인증해 주세요">
        <PhoneLinkWizard />
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
