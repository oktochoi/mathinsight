import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

const protectedPrefixes = [
  '/dashboard',
  '/students',
  '/lesson-logs',
  '/consultation-cards',
  '/parent-reports',
  '/analytics',
  '/settings',
];
const parentOnly = ['/parent'];
const studentOnly = ['/student'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === '/login' || path === '/signup';
  const needsAuth =
    protectedPrefixes.some((p) => path.startsWith(p)) ||
    parentOnly.some((p) => path.startsWith(p)) ||
    studentOnly.some((p) => path.startsWith(p));

  if (!user && needsAuth) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', path);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/dashboard';
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/students/:path*',
    '/lesson-logs/:path*',
    '/consultation-cards/:path*',
    '/parent-reports/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/parent/:path*',
    '/student/:path*',
    '/login',
    '/signup',
  ],
};
