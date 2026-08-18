import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { headers } from "next/headers";
import { urlInputSchema } from "@/lib/contracts/url-input";
import {
  AUDIT_FORM_ERRORS,
  isAllowedProtocol,
  normalizeToHttps,
} from "@/lib/audit/url-policy";
import { auditAction } from "@/lib/audit/actions";
import { auth } from "@/lib/auth";
import { countAuditsInWindow } from "@/lib/audit/tier";
import { defaultRateLimiter } from "@/lib/rate-limit";
import type { AuditFormState } from "@/lib/audit/actions";

/**
 * NextAuth v5 exports `auth` overloaded (middleware + `() => Session | null`);
 * vi.mocked() resolves the middleware overload, so the mock is cast to the
 * session-returning call shape the action actually uses.
 */
const authMock = auth as unknown as Mock<() => Promise<Session | null>>;

/**
 * U5.T4 — rate limiting integration (ADF-9, RTL-4/5). The action module's
 * limiter singleton is mocked so tests control the decision; the IP key
 * resolution stays REAL (imported from the actual module) so the header→key
 * wiring is exercised. `next/headers` is mocked because vitest has no request
 * context; the default (empty headers) yields the local-dev fallback key.
 */
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    defaultRateLimiter: {
      check: vi.fn(() => ({ allowed: true, remaining: 5, resetMs: 0 })),
      reset: vi.fn(),
    },
  };
});

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

/**
 * U3.T2 — tier pre-check (TLM-3). The auth stack and the prisma singleton are
 * mocked so the action never touches a real DB nor instantiates NextAuth.
 * `countAuditsInWindow` is mocked (the pure query contract is covered in
 * tier.test.ts); `hasFreeAuditsLeft` stays REAL (importOriginal spread) so the
 * action's gate is exercised through the actual helper.
 */
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/audit/tier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit/tier")>();
  return {
    ...actual,
    countAuditsInWindow: vi.fn(async () => 0),
  };
});

const session = (): Session => ({
  user: { id: "user-1", name: "Ana", email: "ana@example.com" },
  expires: new Date("2026-08-19T00:00:00.000Z").toISOString(),
});

const fd = (url: string): FormData => {
  const formData = new FormData();
  formData.set("url", url);
  return formData;
};

async function expectRedirect(
  formData: FormData,
  expectedTarget: string,
): Promise<void> {
  try {
    await auditAction({ error: null }, formData);
    expect.unreachable("auditAction should have redirected");
  } catch (err) {
    const digest = (err as { digest?: string }).digest ?? "";
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain(expectedTarget);
  }
}

/**
 * U2.T1/U2.T2 — Server Action contract (ADF-3/4/5).
 * - isAllowedProtocol: pure protocol filter, http/https only (ADF-3).
 * - normalizeToHttps: silent http→https upgrade, idempotent (ADF-4).
 * - auditAction: FormData → Zod → filter → normalize → redirect (ADF-5),
 *   inline errors instead of throwing for validation failures.
 *
 * The redirect assertions use the REAL next/navigation redirect, which throws
 * a NEXT_REDIRECT error carrying the target in its digest — no mocks needed.
 */
describe("isAllowedProtocol (ADF-3)", () => {
  it("accepts http and https schemes", () => {
    expect(isAllowedProtocol("http://ejemplo.com")).toBe(true);
    expect(isAllowedProtocol("https://ejemplo.com")).toBe(true);
  });

  it("rejects non-http(s) schemes", () => {
    expect(isAllowedProtocol("ftp://archivos.ejemplo.com")).toBe(false);
    expect(isAllowedProtocol("mailto:hola@ejemplo.com")).toBe(false);
    expect(isAllowedProtocol("file:///etc/passwd")).toBe(false);
    expect(isAllowedProtocol("javascript:alert(1)")).toBe(false);
  });

  it("rejects malformed strings that cannot be parsed as URLs", () => {
    expect(isAllowedProtocol("not a url")).toBe(false);
    expect(isAllowedProtocol("")).toBe(false);
  });
});

describe("normalizeToHttps (ADF-4)", () => {
  it("silently upgrades http to https", () => {
    expect(normalizeToHttps("http://ejemplo.com")).toBe("https://ejemplo.com/");
  });

  it("leaves https untouched (idempotent double normalization)", () => {
    expect(normalizeToHttps("https://ejemplo.com")).toBe(
      "https://ejemplo.com/",
    );
  });

  it("preserves path, query and hash", () => {
    expect(normalizeToHttps("http://ejemplo.com/guia?q=geo#top")).toBe(
      "https://ejemplo.com/guia?q=geo#top",
    );
  });
});

describe("urlInputSchema accepts ftp (protocol filter is mandatory)", () => {
  it("passes ftp:// through Zod — the filter, not the schema, rejects it", () => {
    const result = urlInputSchema.safeParse({
      url: "ftp://archivos.ejemplo.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("auditAction (ADF-5)", () => {
  it("redirects to /report?url= for a valid https URL", async () => {
    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );
  });

  it("normalizes http to https before redirecting (ADF-4)", async () => {
    await expectRedirect(
      fd("http://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );
  });

  it("returns an inline error for a non-http(s) protocol (ADF-3)", async () => {
    const state = await auditAction(
      { error: null },
      fd("ftp://archivos.ejemplo.com"),
    );
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.protocol });
  });

  it("returns an inline error for an invalid URL format", async () => {
    const state = await auditAction({ error: null }, fd("not a url"));
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.invalidUrl });
  });

  it("returns an inline error when the url field is missing", async () => {
    const state = await auditAction({ error: null }, new FormData());
    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.invalidUrl });
  });

  it("never throws on validation failures — inline state only", async () => {
    const bad: Array<string | null> = ["not a url", "", "ftp://x.com"];
    for (const value of bad) {
      const formData = new FormData();
      if (value !== null) formData.set("url", value);
      const state: AuditFormState = await auditAction(
        { error: null },
        formData,
      );
      expect(state.error).not.toBeNull();
    }
  });
});

describe("auditAction rate limiting (ADF-9, RTL-4/5)", () => {
  beforeEach(() => {
    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(defaultRateLimiter.check).mockReset();
    vi.mocked(defaultRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 5,
      resetMs: 0,
    });
  });

  it("returns the friendly over-limit error instead of redirecting", async () => {
    vi.mocked(defaultRateLimiter.check).mockReturnValue({
      allowed: false,
      remaining: 0,
      resetMs: 60_000,
    });

    const state = await auditAction({ error: null }, fd("https://ejemplo.com"));

    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.rateLimited });
  });

  it("checks the limiter before validation — over-limit wins over a bad URL", async () => {
    vi.mocked(defaultRateLimiter.check).mockReturnValue({
      allowed: false,
      remaining: 0,
      resetMs: 60_000,
    });

    const state = await auditAction({ error: null }, fd("not a url"));

    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.rateLimited });
  });

  it("keys the limiter by the x-forwarded-for client IP (RTL-3)", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.9" }),
    );

    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );

    expect(defaultRateLimiter.check).toHaveBeenCalledWith("203.0.113.9");
  });

  it("uses the local-dev fallback key when no client header exists", async () => {
    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );

    expect(defaultRateLimiter.check).toHaveBeenCalledWith("local-dev");
  });
});

describe("auditAction tier pre-check (TLM-3)", () => {
  beforeEach(() => {
    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(defaultRateLimiter.check).mockReset();
    vi.mocked(defaultRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 5,
      resetMs: 0,
    });
    authMock.mockReset();
    vi.mocked(countAuditsInWindow).mockReset();
    vi.mocked(countAuditsInWindow).mockResolvedValue(0);
  });

  it("blocks the 4th audit in the window before redirecting (TLM-3)", async () => {
    authMock.mockResolvedValue(session());
    vi.mocked(countAuditsInWindow).mockResolvedValue(3);

    const state = await auditAction({ error: null }, fd("https://ejemplo.com"));

    expect(state).toEqual({ error: AUDIT_FORM_ERRORS.limitReached });
  });

  it("counts the signed-in user's audits for the pre-check", async () => {
    authMock.mockResolvedValue(session());
    vi.mocked(countAuditsInWindow).mockResolvedValue(2);

    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );

    expect(countAuditsInWindow).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      expect.any(Number),
    );
  });

  it("allows a signed-in user with audits left and redirects (TLM-2)", async () => {
    authMock.mockResolvedValue(session());
    vi.mocked(countAuditsInWindow).mockResolvedValue(2);

    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );
  });

  it("skips the tier check for anonymous users (TLM-6)", async () => {
    authMock.mockResolvedValue(null);

    await expectRedirect(
      fd("https://ejemplo.com"),
      "/report?url=https%3A%2F%2Fejemplo.com%2F",
    );

    expect(countAuditsInWindow).not.toHaveBeenCalled();
  });
});
