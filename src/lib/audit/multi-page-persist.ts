import type { Prisma } from "@/generated/prisma/client";
import type { MultiPageAggregate, PerPageAudit } from "@/audit/multi-page";

/**
 * Multi-page persistence (MPA-6/7, TLM-10, D3).
 *
 * Runs INSIDE the SAME `$transaction` that created the audit (caller passes
 * the tx callback client): one master `Audit` row whose `result` holds the
 * light aggregate shape `{ aggregate, pages: [{url, geoScore, severityBand,
 * durationMs}] }` (D3 - the master JSON stays small), plus one `AuditPage`
 * row per SUCCESSFUL page carrying the FULL per-page `AuditResult` (1:N,
 * MPA-6). Failed pages (no result) are skipped - there is no AuditResult to
 * persist, they remain visible in the engine's return (MPA-1 isolation).
 *
 * Limit accounting (TLM-10): the master `Audit` row is the single count
 * toward the 30-day window - one row per multi-page run, never per page
 * (MPA-7). There is no separate counter (the `recordPaidAudit` increment was
 * removed with the tier layer).
 */

/** Structural transaction surface - unit-testable (plain mocks, no real DB). */
export type MultiPageTx = {
  audit: {
    create(args: {
      data: {
        userId: string;
        url: string;
        geoScore: number;
        severityBand: string;
        durationMs: number;
        result: Prisma.InputJsonValue;
      };
    }): Promise<{ id: string }>;
  };
  auditPage: {
    createMany(args: {
      data: Array<{
        auditId: string;
        url: string;
        position: number;
        geoScore: number;
        severityBand: string;
        durationMs: number;
        result: Prisma.InputJsonValue;
      }>;
    }): Promise<{ count: number }>;
  };
};

export interface PersistMultiPageArgs {
  userId: string;
  aggregate: MultiPageAggregate;
  pages: PerPageAudit[];
}

/**
 * Persists one multi-page audit inside the caller's `$transaction`: master
 * Audit row → AuditPage rows (createMany, only pages with a result). Returns
 * the created master audit id (the action redirects to its detail page).
 */
export async function persistMultiPageAudit(
  tx: MultiPageTx,
  { userId, aggregate, pages }: PersistMultiPageArgs,
): Promise<string> {
  const succeeded = pages.filter(
    (
      page,
    ): page is PerPageAudit & { result: NonNullable<PerPageAudit["result"]> } =>
      page.result !== null,
  );

  const audit = await tx.audit.create({
    data: {
      userId,
      url: aggregate.url,
      geoScore: Math.round(aggregate.geoScore),
      severityBand: aggregate.severityBand,
      durationMs: Math.round(aggregate.durationMs),
      result: {
        aggregate,
        pages: succeeded.map((page) => ({
          url: page.url,
          geoScore: Math.round(page.result.summary.geoScore),
          severityBand: page.result.summary.severityBand,
          durationMs: Math.round(page.result.summary.durationMs),
        })),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  if (succeeded.length > 0) {
    await tx.auditPage.createMany({
      data: succeeded.map((page, position) => ({
        auditId: audit.id,
        url: page.url,
        position,
        geoScore: Math.round(page.result.summary.geoScore),
        severityBand: page.result.summary.severityBand,
        durationMs: Math.round(page.result.summary.durationMs),
        result: page.result as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  return audit.id;
}
