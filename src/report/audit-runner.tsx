import { runAudit } from "@/audit";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit, recordPaidAudit } from "@/lib/audit/enforcement";
import { isPaidTier } from "@/lib/audit/tier";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import type { Prisma } from "@/generated/prisma/client";
import { DomainScorecard } from "@/report/domain-scorecard";
import {
  detectFetchFailureCode,
  resolveFetchErrorCopy,
} from "@/report/fetch-error-copy";
import { ReportMeta } from "@/report/report-meta";
import { ScoreHero } from "@/report/score-hero";
import { TopFindings } from "@/report/top-findings";

export type AuditRunnerProps = {
  /** Normalized http/https URL to audit (already validated by resolve.ts). */
  url: string;
};

/**
 * Report driver (ARU-1/ARU-2): runs `runAudit(url)` under the page Suspense.
 *
 * U4: on success it composes the full MVP report (D1) — ScoreHero +
 * DomainScorecard + TopFindings + ReportMeta (ARU-8). Degraded results
 * (RAO-12/RAO-13) render honestly: "No disponible" chips, visible
 * `meta.errors` and the true (rebalanced) GEO Score (ARU-7).
 *
 * U3 persist gate (TLM-4/5/6, D5): after a SUCCESSFUL audit, signed-in users
 * pass the authoritative tier re-check (TOCTOU guard — the cheap pre-check
 * ran in the action) and the Audit row is persisted with the full AuditResult
 * JSON. Over-limit users see the limit copy and nothing is persisted;
 * anonymous audits never persist (TLM-6). Persistence is best-effort: a DB
 * failure logs and still renders the report (the audit already ran).
 *
 * U4: the gate now branches by tier (TLM-8, design U4) through the SAME
 * `checkTierLimit` used by the action pre-check. For PRO/ENTERPRISE the audit
 * counter is incremented — `recordPaidAudit` runs inside the SAME
 * `$transaction` that creates the Audit row (TLM-7), so the increment is
 * atomic with the persisted result.
 *
 * It catches the page-fetch failure throw and renders the mapped friendly
 * Spanish copy + a Reintentar link (ARU-6); unexpected errors are rethrown so
 * the `error.tsx` boundary (ARU-4) handles them.
 */
export async function AuditRunner({ url }: AuditRunnerProps) {
  let result: AuditResult;
  try {
    result = await runAudit(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detectFetchFailureCode(message) === null) {
      // Not a known fetch failure — let the error boundary (ARU-4) own it.
      throw error;
    }
    return <FetchErrorState url={url} copy={resolveFetchErrorCopy(error)} />;
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (userId) {
    const { allowed } = await checkTierLimit(prisma, userId, Date.now());
    if (!allowed) {
      // Authoritative gate (TLM-4): the audit ran, but the tier says no — show
      // the limit copy (TLM-5) and do NOT persist.
      return <TierLimitState />;
    }

    // U4 (TLM-8): the persist path depends on tier — FREE writes the Audit row
    // directly; PRO/ENTERPRISE increments the paid counter in the same
    // transaction as the Audit row (TLM-7).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });
    try {
      if (user && isPaidTier(user.tier)) {
        await prisma.$transaction(async (tx) => {
          await recordPaidAudit(tx, userId, Date.now());
          await tx.audit.create({
            data: {
              userId,
              url,
              geoScore: Math.round(result.summary.geoScore),
              severityBand: result.summary.severityBand,
              durationMs: Math.round(result.summary.durationMs),
              // AuditResult is JSON-serializable by contract (RAO-10); the
              // engines produce plain data, so this cast only satisfies
              // Prisma's Json input typing (nested `unknown` values in records
              // are not assignable).
              result: result as unknown as Prisma.InputJsonValue,
            },
          });
        });
      } else {
        await prisma.audit.create({
          data: {
            userId,
            url,
            geoScore: Math.round(result.summary.geoScore),
            severityBand: result.summary.severityBand,
            durationMs: Math.round(result.summary.durationMs),
            result: result as unknown as Prisma.InputJsonValue,
          },
        });
      }
    } catch (error) {
      // Best-effort persist: never hide the finished report behind a DB error.
      console.error("audit persist failed", error);
    }
  }

  return <AuditReport result={result} />;
}

function TierLimitState() {
  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h2 className="font-display text-3xl tracking-tight text-navy">
        Llegaste al límite de auditorías gratuitas
      </h2>
      <p className="max-w-md text-text-secondary">
        {AUDIT_FORM_ERRORS.limitReached}
      </p>
    </section>
  );
}

function FetchErrorState({ url, copy }: { url: string; copy: string }) {
  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h2 className="font-display text-3xl tracking-tight text-navy">
        No pudimos analizar el sitio
      </h2>
      <p className="max-w-md text-text-secondary">{copy}</p>
      <a
        href={`/report?url=${encodeURIComponent(url)}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Reintentar
      </a>
    </section>
  );
}

function AuditReport({ result }: { result: AuditResult }) {
  return (
    <section
      aria-label="Reporte de auditoría"
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16"
    >
      <ScoreHero summary={result.summary} />
      <DomainScorecard result={result} />
      <TopFindings
        citability={result.citability}
        schema={result.schema}
        crawlers={result.crawlers}
      />
      <ReportMeta summary={result.summary} meta={result.meta} />
    </section>
  );
}
