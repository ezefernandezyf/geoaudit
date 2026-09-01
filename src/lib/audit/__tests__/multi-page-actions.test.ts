import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { headers } from "next/headers";
import { multiPageAuditAction } from "@/lib/audit/multi-page-actions";
import type { MultiPageFormState } from "@/lib/audit/multi-page-actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit } from "@/lib/audit/enforcement";
import { runMultiPageAudit } from "@/audit/multi-page";
import { persistMultiPageAudit } from "@/lib/audit/multi-page-persist";
import { getDefaultRateLimiter } from "@/lib/rate-limit";

/**
 * U3 - multi-page Server Action (MPA-1, TLM-3/10). The action follows the
 * single-page auditAction contract (rate limit → Zod → protocol → auth →
 * limit check) with NO tier gate (MPA-8 removed): any authenticated user runs
 * `runMultiPageAudit`, persists through the SAME $transaction and redirects
 * to the audit detail page. `checkTierLimit` stays REAL (imported from the
 * actual module) so the limit decision is exercised; everything else is
 * mocked.
 */

const authMock = auth as unknown as Mock<() => Promise<Session | null>>;
const checkTierLimitMock = vi.mocked(checkTierLimit);
const runMultiPageAuditMock = vi.mocked(runMultiPageAudit);
const persistMultiPageAuditMock = vi.mocked(persistMultiPageAudit);
const transactionMock = vi.mocked(prisma.$transaction) as unknown as Mock<
  (...args: unknown[]) => Promise<unknown>
>;

const { limiterMock } = vi.hoisted(() => ({
  limiterMock: {
    check: vi.fn(async () => ({ allowed: true, remaining: 5, resetMs: 0 })),
    reset: vi.fn(async () => {}),
  },
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    getDefaultRateLimiter: vi.fn(async () => limiterMock),
  };
});

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/audit/enforcement", () => ({
  checkTierLimit: vi.fn(async () => ({ allowed: true })),
}));
vi.mock("@/audit/multi-page", () => ({ runMultiPageAudit: vi.fn() }));
vi.mock("@/lib/audit/multi-page-persist", () => ({
  persistMultiPageAudit: vi.fn(async () => "audit-42"),
}));

const session = (): Session => ({
  user: { id: "user-1", name: "Ana", email: "ana@example.com" },
  expires: new Date("2026-08-19T00:00:00.000Z").toISOString(),
});

const engineResult = {
  aggregate: {
    url: "https://example.com/",
    geoScore: 74,
    severityBand: "Fair" as const,
    durationMs: 2400,
  },
  pages: [
    {
      url: "https://example.com/",
      result: { summary: { geoScore: 68 } },
      error: null,
    },
  ],
};

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
    await multiPageAuditAction({ error: null }, formData);
    expect.unreachable("multiPageAuditAction should have redirected");
  } catch (err) {
    const digest = (err as { digest?: string }).digest ?? "";
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain(expectedTarget);
  }
}

beforeEach(() => {
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.mocked(getDefaultRateLimiter).mockClear();
  limiterMock.check.mockReset();
  limiterMock.check.mockResolvedValue({
    allowed: true,
    remaining: 5,
    resetMs: 0,
  });
  authMock.mockReset();
  checkTierLimitMock.mockReset();
  checkTierLimitMock.mockResolvedValue({ allowed: true });
  runMultiPageAuditMock.mockReset();
  persistMultiPageAuditMock.mockReset();
  runMultiPageAuditMock.mockResolvedValue(engineResult as never);
  transactionMock.mockReset();
  transactionMock.mockImplementation(async (...args: unknown[]) => {
    const fn = args[0] as (tx: unknown) => Promise<unknown>;
    return fn({});
  });
});

describe("multiPageAuditAction flow (MPA-1)", () => {
  it("runs the engine, persists in one $transaction and redirects to the detail page", async () => {
    authMock.mockResolvedValue(session());

    await expectRedirect(
      fd("https://example.com"),
      "/dashboard/audits/audit-42",
    );

    expect(runMultiPageAuditMock).toHaveBeenCalledTimes(1);
    expect(runMultiPageAuditMock).toHaveBeenCalledWith("https://example.com");
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(persistMultiPageAuditMock).toHaveBeenCalledTimes(1);
    const [tx, args] = persistMultiPageAuditMock.mock.calls[0] as [
      unknown,
      { userId: string; aggregate: unknown; pages: unknown },
    ];
    expect(tx).toEqual({}); // the $transaction client
    expect(args.userId).toBe("user-1");
    expect(args.aggregate).toEqual(engineResult.aggregate);
    expect(args.pages).toEqual(engineResult.pages);
  });

  it("runs for any authenticated user - no tier lookup (MPA-8 removed)", async () => {
    authMock.mockResolvedValue(session());

    await expectRedirect(
      fd("https://example.com"),
      "/dashboard/audits/audit-42",
    );
    expect(runMultiPageAuditMock).toHaveBeenCalledTimes(1);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("multiPageAuditAction gates", () => {
  it("returns 'auth' without a session", async () => {
    authMock.mockResolvedValue(null);

    const state = await multiPageAuditAction(
      { error: null },
      fd("https://example.com"),
    );

    expect(state).toEqual({ error: "auth" });
    expect(runMultiPageAuditMock).not.toHaveBeenCalled();
  });

  it("returns 'limit' when the user is over their tier limit (TLM-3 pattern)", async () => {
    authMock.mockResolvedValue(session());
    checkTierLimitMock.mockResolvedValue({ allowed: false });

    const state = await multiPageAuditAction(
      { error: null },
      fd("https://example.com"),
    );

    expect(state).toEqual({ error: "limit" });
    expect(runMultiPageAuditMock).not.toHaveBeenCalled();
  });

  it("returns 'invalid' for a malformed URL", async () => {
    authMock.mockResolvedValue(session());

    const state = await multiPageAuditAction({ error: null }, fd("not a url"));

    expect(state).toEqual({ error: "invalid" });
    expect(runMultiPageAuditMock).not.toHaveBeenCalled();
  });

  it("returns 'rate-limited' when the limiter denies (RTL pattern)", async () => {
    limiterMock.check.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetMs: 60_000,
    });

    const state = await multiPageAuditAction(
      { error: null },
      fd("https://example.com"),
    );

    expect(state).toEqual({ error: "rate-limited" });
    expect(authMock).not.toHaveBeenCalled();
  });

  it("returns 'failed' when the engine or persistence throws - never uncaught", async () => {
    authMock.mockResolvedValue(session());
    runMultiPageAuditMock.mockRejectedValue(new Error("engine exploded"));

    const state: MultiPageFormState = await multiPageAuditAction(
      { error: null },
      fd("https://example.com"),
    );

    expect(state.error).toBe("failed");
  });
});
