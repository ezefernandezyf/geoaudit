import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import SharePage from "@/app/share/[token]/page";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

// Public page (SHR-2): the mocked audit delegate exposes ONLY findUnique, so
// any re-run attempt or additional delegate call (findFirst/update/…) the page
// (or its imports) made would throw.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findUnique: findUniqueMock },
  },
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const sharedRow = {
  id: "audit-1",
  // Private fields present on the row — SHR-5: none of these may surface.
  userId: "user-1",
  user: { id: "user-1", email: "owner@example.com", tier: "PRO" },
  url: "https://example.com/",
  geoScore: 68,
  severityBand: "Fair",
  durationMs: 3214,
  shareToken: "tok-1",
  result: auditResultFixture,
  createdAt: new Date("2026-08-10T12:00:00.000Z"),
};

const params = Promise.resolve({ token: "tok-1" });

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(sharedRow);
  vi.mocked(notFound).mockClear();
});

/**
 * U2.5/U2.6 — public share page (SHR-2/5/6, design D4). `/share/[token]` is
 * reachable WITHOUT auth: it looks the audit up by `shareToken` and renders
 * the persisted result through the shared `<AuditReport>` — zero re-runs,
 * zero private fields, unknown token → 404.
 */
describe("SharePage (SHR-2)", () => {
  it("looks the audit up by shareToken and renders the persisted result", async () => {
    render(await SharePage({ params }));

    // Report sections come from the persisted result JSON (SHR-2).
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shareToken: "tok-1" },
    });
    // findUnique is the ONLY delegate call — no re-run, no writes (SHR-2).
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("never exposes private fields (SHR-5)", async () => {
    render(await SharePage({ params }));

    // userId, email and tier live on the row but must not reach the DOM.
    expect(screen.queryByText("user-1")).not.toBeInTheDocument();
    expect(screen.queryByText("owner@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
    // The query itself pulls only the audit row — no user relation.
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shareToken: "tok-1" },
    });
  });
});

describe("SharePage (SHR-6)", () => {
  it("returns 404 for an unknown token", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(SharePage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
