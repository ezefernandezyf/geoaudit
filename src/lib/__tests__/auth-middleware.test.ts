import { describe, expect, it } from "vitest";
import { requireDashboardAuth } from "@/lib/auth-guard";

/**
 * U2 — auth-github R3 delta: unauthenticated requests to /dashboard/:path*
 * are 307-redirected to the custom /login page preserving the original path
 * as callbackUrl (was: /api/auth/signin with the full href).
 */
describe("requireDashboardAuth (auth-github R3)", () => {
  it("redirects unauthenticated /dashboard requests to /login with 307", () => {
    const res = requireDashboardAuth(
      new URL("http://localhost:3000/dashboard"),
      false,
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(307);
    const location = new URL(res!.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/dashboard");
  });

  it("preserves the original subpath and query as callbackUrl", () => {
    const res = requireDashboardAuth(
      new URL("http://localhost:3000/dashboard/history?tab=all"),
      false,
    );
    expect(res!.status).toBe(307);
    const location = new URL(res!.headers.get("location") ?? "");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "/dashboard/history?tab=all",
    );
  });

  it("returns null (no redirect) for authenticated requests", () => {
    const res = requireDashboardAuth(
      new URL("http://localhost:3000/dashboard"),
      true,
    );
    expect(res).toBeNull();
  });
});
