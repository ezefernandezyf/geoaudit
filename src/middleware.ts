import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { requireDashboardAuth } from "@/lib/auth-guard";

/**
 * Edge middleware (auth-github R3 delta, design U2).
 *
 * Built from the edge-safe authConfig (no Prisma adapter — importing the
 * full config from auth.ts would pull pg into the Edge bundle). The wrapper
 * only decodes the JWT session cookie; the adapter is not involved.
 *
 * /dashboard/:path* requires a session: unauthenticated requests are
 * 307-redirected to /login?callbackUrl=<original-path>.
 *
 * NOTE: the matcher MUST stay a literal here — Next.js statically analyzes
 * `config.matcher` at compile time; referencing an imported constant makes it
 * fall back to matching every route (verified empirically with Turbopack).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  return requireDashboardAuth(req.nextUrl, Boolean(req.auth));
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
