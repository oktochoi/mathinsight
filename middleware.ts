import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { isProtectedAppPath, portalRedirectForProtectedPath } from '@/lib/authRedirectPolicy';
import { normalizeUserProfile } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

type ProfileReadResult = {
  profile: UserProfile | null;
  rawDbRole: string | null;
};

async function readProfile(
  supabase: NonNullable<ReturnType<typeof createClient>['supabase']>,
  userId: string
): Promise<ProfileReadResult> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!data) return { profile: null, rawDbRole: null };
  return {
    profile: normalizeUserProfile(data as UserProfile),
    rawDbRole: data.role as string,
  };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!isProtectedAppPath(path)) {
    return NextResponse.next();
  }

  try {
    const { supabase, response } = createClient(request);

    if (!supabase) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/auth';
      redirect.searchParams.set('next', path);
      return NextResponse.redirect(redirect);
    }

    const { profile, rawDbRole } = await readProfile(supabase, user.id);
    const dest = portalRedirectForProtectedPath(path, user, profile, rawDbRole);

    if (dest && dest !== path) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = dest;
      redirect.search = '';
      return NextResponse.redirect(redirect);
    }

    return response;
  } catch {
    return NextResponse.next({ request: { headers: request.headers } });
  }
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/schedule',
    '/schedule/:path*',
    '/students',
    '/students/:path*',
    '/lesson-logs',
    '/lesson-logs/:path*',
    '/consultation-cards',
    '/consultation-cards/:path*',
    '/parent-reports',
    '/parent-reports/:path*',
    '/analytics',
    '/analytics/:path*',
    '/settings',
    '/settings/:path*',
    '/parent',
    '/parent/:path*',
    '/student',
    '/student/:path*',
  ],
};
