import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import SharePage from "@/app/share/[token]/page";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import type { MultiPageResult } from "@/lib/contracts/audit-result";

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
  // Private fields present on the row - SHR-5: none of these may surface.
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
 * U5.10 - public share page (SHR-2/5/6/7/8/9, design U5). Gemini SharePage
 * composition over the persisted row: "Verificado" pill (SHR-7), token ID in
 * the verification banner (SHR-8), footer CTA (SHR-9). Reachable WITHOUT
 * auth; zero re-runs; zero private fields; unknown token → 404.
 */
describe("SharePage (SHR-2)", () => {
  it("looks the audit up by shareToken and renders the persisted report", async () => {
    render(await SharePage({ params }));

    // Report comes from the persisted result through the adapter: hero score
    // + benchmark + hostname domain.
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("90 - 100")).toBeInTheDocument();
    expect(screen.getAllByText("example.com").length).toBeGreaterThanOrEqual(1);
    // "Regular" appears in the hero + the bottom-passage finding badges.
    expect(screen.getAllByText("Regular").length).toBeGreaterThanOrEqual(1);

    // Public share shell (Gemini header).
    expect(
      screen.getByText("Reporte de Visibilidad de IA"),
    ).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Auditar mi URL gratis" }),
    ).toHaveAttribute("href", "/");

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shareToken: "tok-1" },
    });
    // findUnique is the ONLY delegate call - no re-run, no writes (SHR-2).
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("shows the Verificado pill and the share token ID (SHR-7/8)", async () => {
    render(await SharePage({ params }));

    expect(screen.getByText("Verificado")).toBeInTheDocument();
    // Token ID visible in mono (banner) + via the report ctx.
    expect(screen.getByText(/ID: tok-1/)).toBeInTheDocument();
  });

  it("renders the Relevy brand in the public header (SHL-4, rebrand)", async () => {
    render(await SharePage({ params }));

    // The legacy GeoAudit wordmark (and its "G" tile) are gone from the
    // public share shell - the Relevy brand wordmark renders instead.
    expect(screen.getByText("Relevy")).toBeInTheDocument();
    expect(screen.queryByText("GeoAudit")).not.toBeInTheDocument();
  });

  it("includes the footer CTA inviting the visitor to run their own audit (SHR-9)", async () => {
    render(await SharePage({ params }));

    expect(
      screen.getByText("¿Quiere saber cómo citan los motores de IA su sitio?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Comenzar auditoría gratuita" }),
    ).toHaveAttribute("href", "/");
  });

  it("never exposes private fields (SHR-5)", async () => {
    render(await SharePage({ params }));

    expect(screen.queryByText("user-1")).not.toBeInTheDocument();
    expect(screen.queryByText("owner@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
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

describe("SharePage (multi-page fix, verify warning #4)", () => {
  const multiPageRow = {
    id: "audit-mp",
    userId: "user-1",
    url: "https://example.com/",
    geoScore: 74,
    severityBand: "Fair",
    durationMs: 2400,
    shareToken: "tok-mp",
    result: {
      aggregate: {
        url: "https://example.com/",
        geoScore: 74,
        severityBand: "Fair",
        durationMs: 2400,
      },
      pages: [
        {
          url: "https://example.com/",
          geoScore: 68,
          severityBand: "Fair",
          durationMs: 900,
        },
        {
          url: "https://example.com/blog",
          geoScore: 80,
          severityBand: "Good",
          durationMs: 1100,
        },
      ],
    } satisfies MultiPageResult,
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
  };

  it("renders MultiPageReport for a shared multi-page audit (no crash)", async () => {
    findUniqueMock.mockResolvedValue(multiPageRow);

    render(await SharePage({ params: Promise.resolve({ token: "tok-mp" }) }));

    expect(screen.getByText("74")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/blog")).toBeInTheDocument();
    expect(screen.getByText("80/100")).toBeInTheDocument();
    // The token ID still renders for multi-page shares (SHR-8).
    expect(screen.getByText(/ID: tok-mp/)).toBeInTheDocument();
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
