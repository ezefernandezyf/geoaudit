import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { runAudit } from "@/audit";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countAuditsInWindow } from "@/lib/audit/tier";
import { AuditRunner } from "@/report/audit-runner";
import {
  degradedCitabilityResult,
  unsupportedPageResult,
} from "@/report/__tests__/variants";

vi.mock("@/audit", () => ({ runAudit: vi.fn() }));

/**
 * U3.T4 — tier persist gate (TLM-4/5/6, D5). auth + prisma are mocked so the
 * runner never instantiates NextAuth nor touches a real DB; the pure
 * countAuditsInWindow query contract is covered in tier.test.ts.
 * `hasFreeAuditsLeft` stays REAL (importOriginal spread).
 */
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { audit: { create: vi.fn() } },
}));
vi.mock("@/lib/audit/tier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit/tier")>();
  return {
    ...actual,
    countAuditsInWindow: vi.fn(async () => 0),
  };
});

const runAuditMock = vi.mocked(runAudit);

/**
 * NextAuth v5 exports `auth` overloaded (middleware + `() => Session | null`);
 * vi.mocked() resolves the middleware overload, so the mock is cast to the
 * session-returning call shape the runner actually uses.
 */
const authMock = auth as unknown as Mock<() => Promise<Session | null>>;
const countMock = vi.mocked(countAuditsInWindow);
const auditCreateMock = vi.mocked(prisma.audit.create);

const session = (): Session => ({
  user: { id: "user-1", name: "Ana", email: "ana@example.com" },
  expires: "2026-08-19T00:00:00.000Z",
});

/**
 * U4.T1 — AuditRunner composes the full MVP report: ScoreHero +
 * DomainScorecard + TopFindings + ReportMeta (ARU-8), keeps the fetch-failure
 * copy mapping (ARU-6, pulled forward in U3) and renders degraded results
 * honestly (ARU-7 / RAO-13).
 */
describe("AuditRunner report render (U4.T1)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
  });

  it("calls runAudit with the url prop", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    await AuditRunner({ url: "https://example.com/" });
    expect(runAuditMock).toHaveBeenCalledWith("https://example.com/");
  });

  it("renders the full MVP report: hero, scorecard, findings and meta", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    render(await AuditRunner({ url: "https://example.com/" }));

    // ScoreHero: score + URL + band chip.
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();

    // DomainScorecard rows.
    expect(screen.getByText("Acceso de bots")).toBeInTheDocument();
    expect(screen.getByText("Citabilidad")).toBeInTheDocument();
    expect(screen.getByText("E-E-A-T")).toBeInTheDocument();
    expect(screen.getByText("Datos estructurados")).toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();

    // TopFindings: blocked bot + schema issue.
    expect(screen.getByText("OAI-SearchBot")).toBeInTheDocument();
    expect(screen.getByText("Organization missing sameAs")).toBeInTheDocument();
  });

  it("no longer renders the U3 placeholder note", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    render(await AuditRunner({ url: "https://example.com/" }));

    expect(
      screen.queryByText(/reporte completo estará disponible/),
    ).not.toBeInTheDocument();
  });

  it("renders degraded results honestly: chips + meta.errors (ARU-7)", async () => {
    runAuditMock.mockResolvedValue(degradedCitabilityResult);
    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.getByText("citability: boom")).toBeInTheDocument();
    // The remaining engines still score.
    expect(screen.getByText("71")).toBeInTheDocument();
  });

  it("renders the RAO-13 non-HTML report with crawler data only", async () => {
    runAuditMock.mockResolvedValue(unsupportedPageResult);
    render(await AuditRunner({ url: "https://cdn.example.com/file.pdf" }));

    expect(screen.getAllByText("No disponible")).toHaveLength(4);
    expect(screen.getByText("71")).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });
});

describe("AuditRunner fetch failure (ARU-6)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
  });

  it("renders the timeout copy and a Reintentar link when runAudit throws TIMEOUT", async () => {
    runAuditMock.mockRejectedValue(
      new Error(
        "audit page fetch failed for https://lento.com/: TIMEOUT: aborted",
      ),
    );
    render(await AuditRunner({ url: "https://lento.com/" }));

    expect(
      screen.getByText(
        "El sitio tardó demasiado en responder. Verificá que la URL sea correcta.",
      ),
    ).toBeInTheDocument();
    const retry = screen.getByRole("link", { name: "Reintentar" });
    expect(retry).toHaveAttribute(
      "href",
      "/report?url=https%3A%2F%2Flento.com%2F",
    );
  });

  it("renders the DNS failure copy", async () => {
    runAuditMock.mockRejectedValue(
      new Error(
        "audit page fetch failed for https://noexiste.com/: DNS_FAILURE: nxdomain",
      ),
    );
    render(await AuditRunner({ url: "https://noexiste.com/" }));

    expect(
      screen.getByText("El dominio no existe o no se puede resolver."),
    ).toBeInTheDocument();
  });

  it("renders the HTTP error copy", async () => {
    runAuditMock.mockRejectedValue(
      new Error("audit page fetch failed for https://x.com/: HTTP_STATUS: 500"),
    );
    render(await AuditRunner({ url: "https://x.com/" }));

    expect(
      screen.getByText(
        "El sitio respondió con un error. Probá visitarlo directamente.",
      ),
    ).toBeInTheDocument();
  });

  it("rethrows unexpected errors so the error boundary handles them (ARU-4)", async () => {
    runAuditMock.mockRejectedValue(new Error("engine exploded"));
    await expect(AuditRunner({ url: "https://x.com/" })).rejects.toThrow(
      "engine exploded",
    );
  });
});

describe("AuditRunner tier persist (TLM-4/5/6)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
    authMock.mockReset();
    countMock.mockReset();
    auditCreateMock.mockReset();
    authMock.mockResolvedValue(null);
    countMock.mockResolvedValue(0);
  });

  it("persists an Audit for a signed-in user within the limit (TLM-4)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(session());
    countMock.mockResolvedValue(2);

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(auditCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        url: "https://example.com/",
        geoScore: 68,
        severityBand: "Fair",
        durationMs: 3214,
        result: auditResultFixture,
      },
    });
    // The report still renders after persisting.
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("renders the limit copy and does NOT persist when over the limit (TLM-5)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(session());
    countMock.mockResolvedValue(3);

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "3 auditorías gratuitas",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "se reinicia 30 días después de cada auditoría",
    );
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("never persists for anonymous users (TLM-6)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(null);

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(auditCreateMock).not.toHaveBeenCalled();
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("still renders the report when persistence fails (degraded)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(session());
    countMock.mockResolvedValue(0);
    auditCreateMock.mockRejectedValue(new Error("db down"));

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText("68")).toBeInTheDocument();
  });
});
