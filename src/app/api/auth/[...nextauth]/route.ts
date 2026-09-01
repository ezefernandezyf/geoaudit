import { handlers } from "@/lib/auth";

/**
 * NextAuth v5 route handler - GET + POST at /api/auth/[...nextauth] (auth-github R2).
 */
export const { GET, POST } = handlers;
