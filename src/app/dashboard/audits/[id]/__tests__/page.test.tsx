import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound, redirect } from "next/navigation";
import AuditDetailPage from "@/app/dashboard/audits/[id]/page";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

const { authMock, findFirstMock, auditPageFindManyMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  auditPageFindManyMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
// Read-only page (ADP-3): the mocked audit delegate exposes ONLY findFirst, so
// any write/re-run call the page (or its imports) attempted would throw. The
// tier lookup is absent: no gate exists (ADP-7/8 removed).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findFirst: findFirstMock },
    auditPage: { findMany: auditPageFindManyMock },
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
  auditPageFindManyMock.mockReset();
  // Default: no AuditPage rows (single-page audit path is unaffected).
  auditPageFindManyMock.mockResolvedValue([]);
  vi.mocked(notFound).mockClear();
  vi.mocked(redirect).mockClear();
});

/**
 * U5.9 - Audit detail page (ADP-6/7, design U5). `/dashboard/audits/[id]`
 * renders the persisted report through the shared `<AuditReport>` (adapter at
 * the boundary, Gemini composition) plus the Gemini action bar: ShareModal
 * with the real share actions - available to every authenticated owner
 * (ADP-7, no tier gate).
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

describe("AuditDetailPage (ADP-3 + ADP-6)", () => {
  it("renders the persisted report through the adapter without re-running the audit", async () => {
    render(await AuditDetailPage({ params }));

    // Gemini hero: score + benchmark (real thresholds) + hostname domain.
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("80 - 100")).toBeInTheDocument();
    expect(screen.getAllByText("example.com").length).toBeGreaterThanOrEqual(1);

    // Scorecard (6 categories) + matrix (6 platforms, Claude "No medido").
    // "No medido" also appears on the legacy brand row of the scorecard.
    expect(screen.getByText("Scorecard por Categoría")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getAllByText("No medido").length).toBeGreaterThanOrEqual(1);

    // Findings with the real generated JSON-LD code (ADP-6).
    expect(screen.getByText(/"@type": "Organization"/)).toBeInTheDocument();

    // The persisted date surfaces via the adapter ctx (APT-9).
    expect(screen.getAllByText(/2026-08-10/).length).toBeGreaterThanOrEqual(1);

    // findFirst is the only audit delegate call - no re-run, no writes.
    expect(findFirstMock).toHaveBeenCalledTimes(1);
  });
});

describe("AuditDetailPage multi-page report (U3.10, D3)", () => {
  it("renders the MultiPageReport for a persisted multi-page audit", async () => {
    const multiPageResult = {
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
    };
    findFirstMock.mockResolvedValue({ ...auditRow, result: multiPageResult });
    // A3: the drill-down reads the persisted AuditPage rows (full results).
    auditPageFindManyMock.mockResolvedValue([
      {
        id: "page-1",
        auditId: "audit-1",
        url: "https://example.com/",
        position: 0,
        geoScore: 68,
        severityBand: "Fair",
        durationMs: 900,
        result: auditResultFixture,
        createdAt: new Date("2026-08-10T12:00:00.000Z"),
      },
    ]);

    render(await AuditDetailPage({ params }));

    // U6.3: the Gemini MultiPageReport renders a route-selector region
    // ("Rutas y URLs Analizadas") + the aggregate "Desglose por Ruta" header.
    expect(
      screen.getByRole("region", { name: "Rutas y URLs Analizadas" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Desglose por Ruta/)).toBeInTheDocument();
    expect(screen.getByText("https://example.com/blog")).toBeInTheDocument();
    expect(screen.getByText("80/100")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Reporte de auditoría" }),
    ).not.toBeInTheDocument();
  });
});

describe("AuditDetailPage multi-page drill-down (A3, MPU-7/8)", () => {
  const multiPageResult = {
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
  };

  /** AuditPage rows as Prisma returns them: `result` is the raw JSON. */
  const auditPageRows = [
    {
      id: "page-1",
      auditId: "audit-1",
      url: "https://example.com/",
      position: 0,
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 900,
      result: auditResultFixture,
      createdAt: new Date("2026-08-10T12:00:00.000Z"),
    },
    {
      id: "page-2",
      auditId: "audit-1",
      url: "https://example.com/blog",
      position: 1,
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 900,
      result: {
        ...auditResultFixture,
        summary: {
          ...auditResultFixture.summary,
          url: "https://example.com/blog",
        },
      },
      createdAt: new Date("2026-08-10T12:00:00.000Z"),
    },
  ];

  it("queries AuditPage rows ordered by position for the multi-page audit (A3)", async () => {
    findFirstMock.mockResolvedValue({ ...auditRow, result: multiPageResult });
    auditPageFindManyMock.mockResolvedValue(auditPageRows);

    await AuditDetailPage({ params });

    expect(auditPageFindManyMock).toHaveBeenCalledWith({
      where: { auditId: "audit-1" },
      orderBy: { position: "asc" },
    });
  });

  it("renders the FULL per-page report from AuditPage rows via the Gemini view model (MPU-7)", async () => {
    findFirstMock.mockResolvedValue({ ...auditRow, result: multiPageResult });
    auditPageFindManyMock.mockResolvedValue(auditPageRows);

    render(await AuditDetailPage({ params }));

    // The full report composes the shared presenters: scorecard, matrix, findings.
    expect(
      screen.getByRole("region", { name: "Scorecard por categoría" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Hallazgos técnicos" }),
    ).toBeInTheDocument();
    // Real per-page data flows through the adapter (fixture findings).
    expect(
      screen.getAllByText(/Pasaje altamente citable/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders an honest empty state when no AuditPage rows exist (MPU-8)", async () => {
    findFirstMock.mockResolvedValue({ ...auditRow, result: multiPageResult });
    auditPageFindManyMock.mockResolvedValue([]);

    render(await AuditDetailPage({ params }));

    expect(
      screen.getByText(/No hay detalle disponible para esta auditoría/),
    ).toBeInTheDocument();
    // No fabricated page or metric appears.
    expect(
      screen.queryByRole("region", { name: "Scorecard por categoría" }),
    ).not.toBeInTheDocument();
  });
});

describe("AuditDetailPage share (ADP-7)", () => {
  it("renders share for every authenticated owner - no tier lookup (ADP-7)", async () => {
    render(await AuditDetailPage({ params }));

    expect(
      screen.getByRole("button", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mejorar a PRO" }),
    ).not.toBeInTheDocument();
  });

  it("owner: share trigger opens the Gemini modal with the real create action (ADP-7)", async () => {
    render(await AuditDetailPage({ params }));

    expect(
      screen.getByRole("button", { name: "Compartir reporte" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mejorar a PRO" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));
    expect(
      screen.getByRole("button", { name: "Activar enlace" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Compartir Reporte Público")).toBeInTheDocument();
  });

  it("owner with a token: modal shows the public link, revoke and social intents", async () => {
    findFirstMock.mockResolvedValue({ ...auditRow, shareToken: "tok-9" });

    render(await AuditDetailPage({ params }));

    fireEvent.click(screen.getByRole("button", { name: "Compartir reporte" }));

    expect(
      screen.getByDisplayValue(`${window.location.origin}/share/tok-9`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revocar enlace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Compartir en X" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ver vista pública/ }),
    ).toHaveAttribute("href", "/share/tok-9");
  });
});

/**
 * DASH-19.1 (sprint 19): the audit detail page serves a BreadcrumbList
 * JSON-LD block with the honest trail Home > Dashboard > Auditoría and the
 * terminal item resolved to its own route (no placeholder).
 */
describe("AuditDetailPage breadcrumbs (DASH-19.1)", () => {
  it("serves a BreadcrumbList with Home > Dashboard > Auditoría (DASH-19.1)", async () => {
    const { container } = render(await AuditDetailPage({ params }));

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const payloads = [...scripts].map((script) =>
      JSON.parse(script.textContent ?? ""),
    );
    const crumbs = payloads.find(
      (payload) => payload["@type"] === "BreadcrumbList",
    );
    expect(crumbs).toBeDefined();
    expect(
      crumbs.itemListElement.map((item: { name: string }) => item.name),
    ).toEqual(["Home", "Dashboard", "Auditoría"]);
    expect(
      crumbs.itemListElement.map((item: { position: number }) => item.position),
    ).toEqual([1, 2, 3]);
    // The terminal item URL resolves to the real route - never a placeholder.
    expect(crumbs.itemListElement[2].item).toMatch(
      /^https?:\/\/.+\/dashboard\/audits\/audit-1$/,
    );
  });
});
