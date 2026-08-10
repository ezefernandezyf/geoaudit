import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth v5 config — Sprint 0 skeleton (auth-github R1).
 * GitHub is the only provider; no DB adapter yet (JWT session strategy).
 * Credentials provider lands in Sprint 3.
 */
export const authConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
