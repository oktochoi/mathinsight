import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { readUserDbRole } from '@/lib/middlewareAuth';
import { resolvePostAuthWithWorkspaces, WORKSPACE_COOKIE } from '@/lib/workspace/postAuth';
import { normalizeUserProfile } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ path: '/login' });
  }

  const { profile: profileRow, rawDbRole } = await readUserDbRole(supabase, user.id, user);
  const profile = profileRow
    ? normalizeUserProfile(profileRow as UserProfile)
    : null;

  const next = new URL(request.url).searchParams.get('next');
  const workspaceCookieId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;

  const path = await resolvePostAuthWithWorkspaces(
    supabase,
    user,
    profile,
    rawDbRole,
    next,
    workspaceCookieId
  );

  return NextResponse.json({ path });
}
