import { auth } from "@/lib/auth";
import { requireDashboardAuth } from "@/lib/auth-guard";

/**
 * Edge middleware (auth-github R3): /dashboard requires a session.
 * Unauthenticated requests are 307-redirected to the sign-in page with a
 * callbackUrl back to the requested path.
 */
export default auth((req) => {
  return requireDashboardAuth(req.nextUrl, Boolean(req.auth));
});

export const config = {
  matcher: ["/dashboard"],
};
