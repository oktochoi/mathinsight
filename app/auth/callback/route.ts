import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import {
  PROFILE_SETUP_COMPLETE,
  PROFILE_SETUP_PENDING,
  syncAuthMetadataFromProfile,
} from '@/lib/authProfileSetup';
import { repairProfileRole } from '@/lib/profileIntegrity';
import { normalizeUserProfile } from '@/lib/roles';
import { absolutePath, getRequestSiteOrigin } from '@/lib/siteUrl';
import type { UserProfile } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = getRequestSiteOrigin(request);
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get('code');
  const oauthError =
    searchParams.get('error_description') ?? searchParams.get('error');

  if (oauthError) {
    const authUrl = new URL('/auth', origin);
    authUrl.searchParams.set('error', oauthError.slice(0, 200));
    return NextResponse.redirect(authUrl);
  }

  if (!code) {
    return NextResponse.redirect(absolutePath('/auth?error=oauth_missing', origin));
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(absolutePath('/auth?error=oauth_exchange', origin));
  }

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(absolutePath('/auth?error=oauth_exchange', origin));
  }

  const displayName =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '사용자';

  const { data: profileRow } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const rawDbRole = profileRow?.role as string | undefined;

  let profile = profileRow
    ? normalizeUserProfile(profileRow as UserProfile)
    : null;

  profile = await repairProfileRole(user.id, profile, user.user_metadata, supabase);

  if (!profile) {
    const setupFlag = user.user_metadata?.profile_setup as string | undefined;
    if (setupFlag !== PROFILE_SETUP_COMPLETE) {
      await supabase.auth.updateUser({
        data: {
          name: displayName,
          profile_setup: PROFILE_SETUP_PENDING,
        },
      });
      const refreshed = await supabase.auth.getUser();
      user = refreshed.data.user ?? user;
    }
  } else if (rawDbRole) {
    await syncAuthMetadataFromProfile(profile, displayName, rawDbRole, supabase);
    const refreshed = await supabase.auth.getUser();
    user = refreshed.data.user ?? user;
  }

  const path = postAuthDestination(user, profile, rawDbRole ?? null);
  return NextResponse.redirect(absolutePath(path, origin));
}
