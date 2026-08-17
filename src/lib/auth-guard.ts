/**
 * Pure guard used by src/middleware.ts (auth-github R3 delta, design U2).
 * Kept framework-free so the 307-redirect behavior is unit-testable
 * without instantiating NextAuth (see src/lib/__tests__/auth-middleware.test.ts).
 *
 * The middleware matcher itself is an inline literal in src/middleware.ts:
 * Next.js requires `config.matcher` to be statically analyzable, and importing
 * it from here makes the middleware fall back to matching every route.
 */

/**
 * Redirects unauthenticated requests to the custom /login page (was
 * /api/auth/signin) preserving the original path + query as callbackUrl
 * (R3 scenario "redirected to /login?callbackUrl=<original-path>").
 */
export function requireDashboardAuth(
  requestUrl: URL,
  isAuthenticated: boolean,
): Response | null {
  if (isAuthenticated) {
    return null;
  }
  const signInUrl = new URL("/login", requestUrl.origin);
  signInUrl.searchParams.set(
    "callbackUrl",
    requestUrl.pathname + requestUrl.search,
  );
  return Response.redirect(signInUrl, 307);
}
