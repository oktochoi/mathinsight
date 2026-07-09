import { InviteOnlyNotice } from '@/components/auth/InviteOnlyNotice';

export default function JoinAcademyPage() {
  return (
    <InviteOnlyNotice
      role="teacher"
      title="학원 코드 가입"
    />
  );
}
