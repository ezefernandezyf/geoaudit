/**
 * Pure guard used by src/middleware.ts (auth-github R3).
 * Kept framework-free so the 307-redirect behavior is unit-testable
 * without instantiating NextAuth (see src/lib/__tests__/auth-middleware.test.ts).
 */
export function requireDashboardAuth(
  requestUrl: URL,
  isAuthenticated: boolean,
): Response | null {
  if (isAuthenticated) {
    return null;
  }
  const signInUrl = new URL("/api/auth/signin", requestUrl.origin);
  signInUrl.searchParams.set("callbackUrl", requestUrl.href);
  return Response.redirect(signInUrl, 307);
}
