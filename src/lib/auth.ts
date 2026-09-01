import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

/**
 * NextAuth v5 config - auth-github R1/R2/R6 delta, design U2.
 *
 * GitHub is the sole provider. JWT session strategy keeps sessions stateless:
 * the Prisma adapter persists User + Account rows on sign-in but writes NO
 * Session rows (design decision D - no test asserts Session writes).
 *
 * Only imported from Node runtime (route handler + RSC pages). The Edge
 * middleware imports auth.config.ts instead - see that file for why.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
});
