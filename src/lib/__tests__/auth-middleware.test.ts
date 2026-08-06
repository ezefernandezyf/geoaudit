import { describe, expect, it } from "vitest";
import { requireDashboardAuth } from "@/lib/auth-guard";

describe("requireDashboardAuth (auth-github R3)", () => {
  it("redirects unauthenticated /dashboard requests to sign-in with 307", () => {
    const res = requireDashboardAuth(new URL("http://localhost:3000/dashboard"), false);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(307);
    const location = res!.headers.get("location") ?? "";
    expect(location).toMatch(/\/api\/auth\/signin/);
    expect(location).toContain(encodeURIComponent("http://localhost:3000/dashboard"));
  });

  it("returns null (no redirect) for authenticated requests", () => {
    const res = requireDashboardAuth(new URL("http://localhost:3000/dashboard"), true);
    expect(res).toBeNull();
  });
});
