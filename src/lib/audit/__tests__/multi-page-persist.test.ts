import { beforeEach, describe, expect, it, vi } from "vitest";
import { persistMultiPageAudit } from "@/lib/audit/multi-page-persist";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import type { MultiPageAggregate, PerPageAudit } from "@/audit/multi-page";

/**
 * U3 — multi-page persistence (MPA-6/7, TLM-10, D3). `persistMultiPageAudit`
 * orchestrates the SAME $transaction that created the audit: one master
 * `Audit` row (light aggregate result) + N `AuditPage` rows (full per-page
 * AuditResult) + exactly ONE paid-counter increment (TLM-10) — never five.
 * The transaction client is structural (the enforcement.ts pattern), so the
 * whole flow is unit-tested with plain mocks — no real DB.
 */

const NOW = 1_750_000_000_000;

function auditResultFor(url: string, geoScore: number): AuditResult {
  return {
    ...auditResultFixture,
    summary: {
      url,
      geoScore,
      severityBand: "Fair",
      durationMs: 100,
    },
  };
}

const aggregate: MultiPageAggregate = {
  url: "https://example.com/",
  geoScore: 74,
  severityBand: "Fair",
  durationMs: 2400,
};

const pages: PerPageAudit[] = [
  {
    url: "https://example.com/",
    result: auditResultFor("https://example.com/", 68),
    error: null,
  },
  {
    url: "https://example.com/blog",
    result: auditResultFor("https://example.com/blog", 80),
    error: null,
  },
  {
    url: "https://example.com/guia",
    result: auditResultFor("https://example.com/guia", 72),
    error: null,
  },
  {
    url: "https://example.com/about",
    result: auditResultFor("https://example.com/about", 76),
    error: null,
  },
];

const failedPages: PerPageAudit[] = [
  {
    url: "https://example.com/broken",
    result: null,
    error: "TIMEOUT: aborted",
  },
  {
    url: "https://example.com/",
    result: auditResultFor("https://example.com/", 68),
    error: null,
  },
];

const tx = {
  subscription: {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  audit: {
    create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
      id: "audit-master-1",
      ...args.data,
    })),
  },
  auditPage: {
    createMany: vi.fn(
      async (args: { data: Array<Record<string, unknown>> }) => {
        void args;
        return { count: 0 };
      },
    ),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.subscription.findUnique.mockResolvedValue({
    plan: "PRO",
    auditsUsed: 2,
    auditsResetAt: null,
    currentPeriodEnd: null,
  });
  tx.audit.create.mockImplementation(
    async (args: { data: Record<string, unknown> }) => ({
      id: "audit-master-1",
      ...args.data,
    }),
  );
});

describe("persistMultiPageAudit (MPA-6 1:N)", () => {
  it("creates one master Audit and four AuditPage rows referencing it", async () => {
    await persistMultiPageAudit(tx, {
      userId: "user-1",
      aggregate,
      pages,
      now: NOW,
    });

    // Exactly ONE master Audit row.
    expect(tx.audit.create).toHaveBeenCalledTimes(1);
    expect(tx.audit.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        url: "https://example.com/",
        geoScore: 74,
        severityBand: "Fair",
        durationMs: 2400,
        result: {
          aggregate,
          pages: pages.map((page) => ({
            url: page.url,
            geoScore: page.result!.summary.geoScore,
            severityBand: page.result!.summary.severityBand,
            durationMs: page.result!.summary.durationMs,
          })),
        },
      },
    });

    // Four AuditPage rows, each with the full AuditResult and the master id.
    expect(tx.auditPage.createMany).toHaveBeenCalledTimes(1);
    const createManyArgs = tx.auditPage.createMany.mock.calls[0][0] as {
      data: Array<Record<string, unknown>>;
    };
    expect(createManyArgs.data).toHaveLength(4);
    for (const row of createManyArgs.data) {
      expect(row.auditId).toBe("audit-master-1");
    }
    expect(createManyArgs.data[0]).toEqual({
      auditId: "audit-master-1",
      url: "https://example.com/",
      position: 0,
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 100,
      result: pages[0].result,
    });
    expect(createManyArgs.data[3].url).toBe("https://example.com/about");
    expect(createManyArgs.data[3].position).toBe(3);
  });

  it("skips failed pages (no result) when persisting the page rows", async () => {
    await persistMultiPageAudit(tx, {
      userId: "user-1",
      aggregate: { ...aggregate, geoScore: 68 },
      pages: failedPages,
      now: NOW,
    });

    expect(tx.auditPage.createMany).toHaveBeenCalledTimes(1);
    const createManyArgs = tx.auditPage.createMany.mock.calls[0][0] as {
      data: Array<Record<string, unknown>>;
    };
    expect(createManyArgs.data).toHaveLength(1);
    expect(createManyArgs.data[0].url).toBe("https://example.com/");
    expect(createManyArgs.data[0].position).toBe(0);
  });
});

describe("persistMultiPageAudit (MPA-7 / TLM-10 one audit toward tier)", () => {
  it("increments auditsUsed exactly once regardless of page count", async () => {
    await persistMultiPageAudit(tx, {
      userId: "user-1",
      aggregate,
      pages,
      now: NOW,
    });

    expect(tx.subscription.findUnique).toHaveBeenCalledTimes(1);
    expect(tx.subscription.update).toHaveBeenCalledTimes(1);
    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: {
        auditsUsed: { increment: 1 },
        auditsResetAt: null,
      },
    });
  });
});
