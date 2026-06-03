import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { hasAssignedDbRole } from '@/lib/authProfileSetup';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { ChooseRoleForm } from './ChooseRoleForm';
import { PROFILE_SETUP_PENDING } from '@/lib/authProfileSetup';

export const dynamic = 'force-dynamic';

export default async function ChooseRolePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const rawDbRole = (roleRow?.role as string | null) ?? null;

  if (hasAssignedDbRole(rawDbRole)) {
    redirect(postAuthDestination(user, null, rawDbRole));
  }

  const initialName =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '';

  const showPendingInfo = user.user_metadata?.profile_setup === PROFILE_SETUP_PENDING;

  return <ChooseRoleForm initialName={initialName} showPendingInfo={showPendingInfo} />;
}
