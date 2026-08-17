import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

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
export const authConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
} satisfies NextAuthConfig;
