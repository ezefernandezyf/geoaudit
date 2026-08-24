import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { runAudit } from "@/audit";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit, recordPaidAudit } from "@/lib/audit/enforcement";
import { AuditRunner } from "@/report/audit-runner";
import {
  degradedCitabilityResult,
  unsupportedPageResult,
} from "@/report/__tests__/variants";

vi.mock("@/audit", () => ({ runAudit: vi.fn() }));

/**
 * U3.T4 / U4 — tier persist gate (TLM-4/5/6, D5). auth + prisma are mocked so
 * the runner never instantiates NextAuth nor touches a real DB.
 * `checkTierLimit` is mocked (per-tier selection covered in
 * enforcement.test.ts); `isPaidTier` stays REAL (importOriginal spread) so the
 * runner's branch (FREE direct-write vs paid $transaction, TLM-8) is
 * exercised through the actual helper.
 */
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/audit/enforcement", () => ({
  checkTierLimit: vi.fn(async () => ({ allowed: true })),
  recordPaidAudit: vi.fn(async () => {}),
}));
vi.mock("@/lib/audit/tier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit/tier")>();
  return {
    ...actual,
  };
});

const runAuditMock = vi.mocked(runAudit);

/**
 * NextAuth v5 exports `auth` overloaded (middleware + `() => Session | null`);
 * vi.mocked() resolves the middleware overload, so the mock is cast to the
 * session-returning call shape the runner actually uses.
 */
const authMock = auth as unknown as Mock<() => Promise<Session | null>>;
const checkTierLimitMock = vi.mocked(checkTierLimit);
const recordPaidAuditMock = vi.mocked(recordPaidAudit);
const auditCreateMock = vi.mocked(prisma.audit.create);
const userFindUniqueMock = vi.mocked(prisma.user.findUnique) as unknown as Mock<
  () => Promise<{ tier: string } | null>
>;
const transactionMock = vi.mocked(prisma.$transaction) as unknown as Mock<
  (...args: unknown[]) => Promise<unknown>
>;

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
    // "Plataforma" appears twice: scorecard row + matrix column header.
    expect(screen.getAllByText("Plataforma").length).toBeGreaterThanOrEqual(1);

    // Platform matrix is part of the shared report (ADP-4).
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();

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
    checkTierLimitMock.mockReset();
    recordPaidAuditMock.mockReset();
    auditCreateMock.mockReset();
    userFindUniqueMock.mockReset();
    transactionMock.mockReset();
    authMock.mockResolvedValue(null);
    checkTierLimitMock.mockResolvedValue({ allowed: true });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    // Default $transaction runs the callback with a tx exposing audit.create
    // (the free/persist path and the paid branch both call through it).
    transactionMock.mockImplementation(async (...args: unknown[]) => {
      const fn = args[0] as (tx: unknown) => Promise<unknown>;
      return fn({
        audit: { create: auditCreateMock },
        subscription: { findUnique: vi.fn(), update: vi.fn() },
      });
    });
  });

  it("persists an Audit for a signed-in FREE user within the limit (TLM-4)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(session());
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });

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
    expect(transactionMock).not.toHaveBeenCalled();
    expect(recordPaidAuditMock).not.toHaveBeenCalled();
    // The report still renders after persisting.
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("renders the limit copy and does NOT persist when over the limit (TLM-5)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    authMock.mockResolvedValue(session());
    checkTierLimitMock.mockResolvedValue({ allowed: false });

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
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    auditCreateMock.mockRejectedValue(new Error("db down"));

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(screen.getByText("68")).toBeInTheDocument();
  });
});

describe("AuditRunner paid tier persist (TLM-7/8)", () => {
  beforeEach(() => {
    runAuditMock.mockReset();
    authMock.mockReset();
    checkTierLimitMock.mockReset();
    recordPaidAuditMock.mockReset();
    auditCreateMock.mockReset();
    userFindUniqueMock.mockReset();
    transactionMock.mockReset();
    authMock.mockResolvedValue(session());
    checkTierLimitMock.mockResolvedValue({ allowed: true });
    transactionMock.mockImplementation(async (...args: unknown[]) => {
      const fn = args[0] as (tx: unknown) => Promise<unknown>;
      return fn({
        audit: { create: auditCreateMock },
        subscription: { findUnique: vi.fn(), update: vi.fn() },
      });
    });
  });

  it("PRO user: increments the counter and creates the Audit in one $transaction (TLM-7/8)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    userFindUniqueMock.mockResolvedValue({ tier: "PRO" });

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(recordPaidAuditMock).toHaveBeenCalledTimes(1);
    // recordPaidAudit runs inside the tx, then audit.create through the same tx.
    expect(auditCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        url: "https://example.com/",
        geoScore: 68,
        severityBand: "Fair",
      }),
    });
    expect(screen.getByText("68")).toBeInTheDocument();
  });

  it("ENTERPRISE user: uses the paid transaction path (triangulation)", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    userFindUniqueMock.mockResolvedValue({ tier: "ENTERPRISE" });

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(recordPaidAuditMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("FREE user: does NOT use the paid transaction path", async () => {
    runAuditMock.mockResolvedValue(auditResultFixture);
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });

    render(await AuditRunner({ url: "https://example.com/" }));

    expect(transactionMock).not.toHaveBeenCalled();
    expect(recordPaidAuditMock).not.toHaveBeenCalled();
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });
});
