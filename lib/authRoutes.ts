/** Auth 라우트 단일 출처 */
export const AUTH_ROUTES = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  chooseRole: '/auth/choose-role',
  callback: '/auth/callback',
  demo: '/demo',
} as const;

export const AUTH_ENTRY_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.signup,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.resetPassword,
  '/auth',
] as const;

export function isAuthEntryPath(path: string): boolean {
  return (AUTH_ENTRY_PATHS as readonly string[]).includes(path);
}
