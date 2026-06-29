import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { isProtectedAppPath, portalRedirectForProtectedPath } from '@/lib/authRedirectPolicy';
import { authGateRedirect, isAuthGatePath, readUserDbRole } from '@/lib/middlewareAuth';
import { AUTH_ROUTES } from '@/lib/authRoutes';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!isAuthGatePath(path) && !isProtectedAppPath(path)) {
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

    if (isAuthGatePath(path)) {
      if (!user) {
        if (path === AUTH_ROUTES.chooseRole) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = AUTH_ROUTES.login;
          redirect.search = '';
          return NextResponse.redirect(redirect);
        }
        return response;
      }

      const { profile, rawDbRole } = await readUserDbRole(supabase, user.id, user);
      const dest = authGateRedirect(
        path,
        user,
        profile,
        rawDbRole,
        request.nextUrl.searchParams.get('next')
      );

      if (dest && dest !== path) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = dest;
        redirect.search = '';
        return NextResponse.redirect(redirect);
      }

      return response;
    }

    if (!user) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = AUTH_ROUTES.login;
      redirect.searchParams.set('next', path);
      return NextResponse.redirect(redirect);
    }

    const { profile, rawDbRole } = await readUserDbRole(supabase, user.id, user);
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
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth',
    '/auth/choose-role',
    '/dashboard',
    '/dashboard/:path*',
    '/schedule',
    '/schedule/:path*',
    '/students',
    '/students/:path*',
    '/attendance',
    '/attendance/:path*',
    '/homework',
    '/homework/:path*',
    '/grades',
    '/grades/:path*',
    '/counseling',
    '/counseling/:path*',
    '/notices',
    '/notices/:path*',
    '/messages',
    '/messages/:path*',
    '/curriculum',
    '/curriculum/:path*',
    '/lesson-logs',
    '/lesson-logs/:path*',
    '/consultation-cards',
    '/consultation-cards/:path*',
    '/parent-reports',
    '/parent-reports/:path*',
    '/student-growth',
    '/student-growth/:path*',
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
