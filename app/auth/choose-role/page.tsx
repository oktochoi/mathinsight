import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { hasAssignedDbRole } from '@/lib/authProfileSetup';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { resolveUserRoleState } from '@/lib/resolveUserRole';
import { ChooseRoleForm } from './ChooseRoleForm';
import { PROFILE_SETUP_PENDING } from '@/lib/authProfileSetup';


export default async function ChooseRolePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const state = await resolveUserRoleState(supabase, user, { syncMetadata: false });

  if (hasAssignedDbRole(state.rawDbRole)) {
    redirect(postAuthDestination(user, state.profile, state.rawDbRole));
  }

  const initialName =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '';

  const showPendingInfo = user.user_metadata?.profile_setup === PROFILE_SETUP_PENDING;

  return (
    <ChooseRoleForm
      initialName={initialName}
      showPendingInfo={showPendingInfo}
    />
  );
}
