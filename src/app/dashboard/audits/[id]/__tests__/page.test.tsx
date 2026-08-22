import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound, redirect } from "next/navigation";
import AuditDetailPage from "@/app/dashboard/audits/[id]/page";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

const { authMock, findFirstMock, userFindUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
// Read-only page (ADP-3): the mocked audit delegate exposes ONLY findFirst, so
// any write/re-run call the page (or its imports) attempted would throw.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findFirst: findFirstMock },
    user: { findUnique: userFindUniqueMock },
  },
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const auditRow = {
  id: "audit-1",
  userId: "user-1",
  url: "https://example.com/",
  geoScore: 68,
  severityBand: "Fair",
  durationMs: 3214,
  shareToken: null,
  result: auditResultFixture,
  createdAt: new Date("2026-08-10T12:00:00.000Z"),
};

const params = Promise.resolve({ id: "audit-1" });

beforeEach(() => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  findFirstMock.mockReset();
  findFirstMock.mockResolvedValue(auditRow);
  userFindUniqueMock.mockReset();
  // Default: PRO — the share panel renders (U2.7); FREE tests override.
  userFindUniqueMock.mockResolvedValue({ tier: "PRO" });
  vi.mocked(notFound).mockClear();
  vi.mocked(redirect).mockClear();
});

/**
 * U1 — Audit detail page (ADP-1..ADP-3). First dynamic route of the app:
 * `/dashboard/audits/[id]` loads the persisted Audit scoped to the session
 * user (`findFirst { id, userId }`, design D2) and renders the shared
 * `<AuditReport>` from the persisted `result` — never re-runs the audit.
 */
describe("AuditDetailPage (ADP-1/ADP-2)", () => {
  it("queries the audit by id scoped to the session user", async () => {
    await AuditDetailPage({ params });

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-1" },
    });
  });

  it("returns 404 when the audit belongs to another user (ADP-2)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-2" } });
    // The row belongs to user-1; the scoped query misses it.
    findFirstMock.mockResolvedValue(null);

    await expect(AuditDetailPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-2" },
    });
  });

  it("returns 404 when the audit does not exist (ADP-2)", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(AuditDetailPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("redirects to /login without a session (defensive, middleware guards /dashboard/*)", async () => {
    authMock.mockResolvedValue(null);

    await expect(AuditDetailPage({ params })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(findFirstMock).not.toHaveBeenCalled();
  });
});

describe("AuditDetailPage (ADP-3)", () => {
  it("renders the persisted report without re-running the audit", async () => {
    render(await AuditDetailPage({ params }));

    // Report sections come from the persisted result JSON (ADP-3).
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
    expect(screen.getByText("Acceso de bots")).toBeInTheDocument();

    // findFirst is the only audit delegate call — no re-run, no writes.
    expect(findFirstMock).toHaveBeenCalledTimes(1);
  });
});

describe("AuditDetailPage share UI (U2.7, SHR-3, TLM-9)", () => {
  it("shows the upgrade CTA for a FREE user — never the share panel", async () => {
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });

    render(await AuditDetailPage({ params }));

    const cta = screen.getByRole("link", { name: "Mejorar a PRO" });
    expect(cta).toHaveAttribute("href", "/pricing");
    expect(
      screen.queryByRole("button", { name: "Crear link" }),
    ).not.toBeInTheDocument();
  });

  it("shows the share panel with 'Crear link' for a PRO user without a token", async () => {
    render(await AuditDetailPage({ params }));

    expect(
      screen.getByRole("button", { name: "Crear link" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mejorar a PRO" }),
    ).not.toBeInTheDocument();
  });

  it("shows the existing public link and revoke for a PRO user with a token (SHR-3/4)", async () => {
    findFirstMock.mockResolvedValue({ ...auditRow, shareToken: "tok-9" });

    render(await AuditDetailPage({ params }));

    expect(
      screen.getByText(`${window.location.origin}/share/tok-9`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeInTheDocument();
  });
});
