import GitHub from "next-auth/providers/github";
import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

/**
 * Edge-safe auth config (auth-github R1/R2/R7 delta, design U2).
 *
 * Deliberately has NO Prisma adapter: src/middleware.ts runs on the Edge
 * runtime and imports this module, while the Prisma adapter pulls in
 * @prisma/adapter-pg → pg → node:net/node:tls (Node-only) — importing it
 * here would break the Edge bundle. The full config in src/lib/auth.ts
 * spreads this object and adds the adapter for Node runtime (API route + RSC).
 *
 * pages.signIn routes every NextAuth internal redirect (e.g. OAuth failure
 * → /login?error=...) to the custom page (R7).
 */

/**
 * Auth.js default session callback (JWT strategy) exposes only name/email/
 * image — NO `id` (verified in @auth/core 0.41.3 lib/init.js). The tier
 * gates (U3) filter audits by `userId`, so the User id must be surfaced:
 * `token.sub` holds it and this pure helper copies it into `session.user.id`.
 * Kept framework-free (pure object spread) so it is unit-testable and
 * Edge-safe for the middleware.
 */
export function exposeUserIdInSession(session: Session, token: JWT): Session {
  if (!token.sub || !session.user) return session;
  return { ...session, user: { ...session.user, id: token.sub } };
}

export const authConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, token }) {
      return exposeUserIdInSession(session, token);
    },
  },
} satisfies NextAuthConfig;
