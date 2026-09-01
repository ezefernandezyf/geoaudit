import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { exposeUserIdInSession } from "@/lib/auth.config";

/**
 * U3.T3 - session callback enabling the tier checks.
 *
 * Auth.js default session callback (JWT strategy) exposes ONLY name/email/
 * image - NO `id` (verified in @auth/core 0.41.3 `lib/init.js`). Without the
 * id, `session.user.id` is undefined and the tier pre-check / persist gate
 * (which filter by `userId`) would silently no-op. The pure helper copies
 * `token.sub` (the User id) into `session.user.id`.
 */
function session(): Session {
  return {
    user: { name: "Ana", email: "ana@example.com", image: null },
    expires: "2026-08-19T00:00:00.000Z",
  };
}

describe("exposeUserIdInSession (JWT session.id)", () => {
  it("copies token.sub into session.user.id", () => {
    const token: JWT = { sub: "user-1" };

    const out = exposeUserIdInSession(session(), token);

    expect(out.user?.id).toBe("user-1");
  });

  it("preserves the existing session user fields", () => {
    const token: JWT = { sub: "user-1", name: "Ana" };

    const out = exposeUserIdInSession(session(), token);

    expect(out.user?.name).toBe("Ana");
    expect(out.user?.email).toBe("ana@example.com");
  });

  it("leaves the session untouched when the token has no sub", () => {
    const token: JWT = {};

    const out = exposeUserIdInSession(session(), token);

    expect(out.user?.id).toBeUndefined();
    expect(out.user?.name).toBe("Ana");
  });
});
