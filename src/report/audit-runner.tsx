import { runAudit } from "@/audit";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit } from "@/lib/audit/enforcement";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import { ANONYMOUS_AUDIT_LIMIT_COPY } from "@/lib/copy";
import { getAnonymousAuditLimiter, resolveClientKey } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import {
  detectFetchFailureCode,
  resolveFetchErrorCopy,
} from "@/report/fetch-error-copy";
import { AuditReport } from "@/report/audit-report";

export type AuditRunnerProps = {
  /** Normalized http/https URL to audit (already validated by resolve.ts). */
  url: string;
};

/**
 * Report driver (ARU-1/ARU-2): runs `runAudit(url)` under the page Suspense.
 *
 * U4: on success it composes the full MVP report (D1) - ScoreHero +
 * DomainScorecard + TopFindings + ReportMeta (ARU-8). Degraded results
 * (RAO-12/RAO-13) render honestly: "No disponible" chips, visible
 * `meta.errors` and the true (rebalanced) GEO Score (ARU-7).
 *
 * U3 persist gate (TLM-4/5/6, D5): after a SUCCESSFUL audit, signed-in users
 * pass the authoritative limit re-check (TOCTOU guard - the cheap pre-check
 * ran in the action) and the Audit row is persisted with the full AuditResult
 * JSON. Over-limit users see the limit copy and nothing is persisted;
 * anonymous audits never persist (TLM-6) and instead pass the anonymous
 * IP-based 3/30d gate (TLM-11): one authoritative increment per completed
 * anonymous audit, keyed `anon:{ip}` - no pre-check in the form action, so
 * the counter is never double-counted (RTL-8). Persistence is best-effort: a
 * DB failure logs and still renders the report (the audit already ran).
 *
 * There is no tier branch (TLM-8 removed): every signed-in user within the
 * limit writes the Audit row directly - no paid counter, no $transaction
 * (TLM-7 removed).
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
      // Not a known fetch failure - let the error boundary (ARU-4) own it.
      throw error;
    }
    return <FetchErrorState url={url} copy={resolveFetchErrorCopy(error)} />;
  }

  const session = await auth();
  const userId = session?.user?.id;
  // PDF-10 (D1): best-effort persistence - the persisted id threads into the
  // report as the direct /api/report/{id}/pdf href (the route owns auth +
  // ownership). Null when the audit did not persist → no export entry.
  let persistedId: string | null = null;
  if (userId) {
    const { allowed } = await checkTierLimit(prisma, userId, Date.now());
    if (!allowed) {
      // Authoritative gate (TLM-4): the audit ran, but the limit says no -
      // show the limit copy (TLM-5) and do NOT persist.
      return <TierLimitState />;
    }

    try {
      const persisted = await prisma.audit.create({
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
      if (persisted) persistedId = persisted.id;
    } catch (error) {
      // Best-effort persist: never hide the finished report behind a DB error.
      console.error("audit persist failed", error);
    }
  } else {
    // Anonymous gate (TLM-11, RTL-8): exactly one increment per completed
    // anonymous audit, keyed `anon:{ip}` (namespaced away from the burst
    // limiter's plain-IP keys). No persist for anonymous (TLM-6). The kill
    // switch lives in the limiter itself (RTL-7: RATE_LIMIT_ENABLED=false).
    const requestHeaders = await headers();
    const ip = resolveClientKey(requestHeaders);
    const anonLimiter = await getAnonymousAuditLimiter();
    const decision = await anonLimiter.check(`anon:${ip}`);
    if (!decision.allowed) {
      return <AnonymousLimitState />;
    }
  }

  return (
    <AuditReport
      result={result}
      ctx={{
        // PDF-10 (D1): direct export link only when the audit persisted;
        // anonymous reports get the PDF signup CTA (D2: no id → no entry).
        exportPdfHref: persistedId ? `/api/report/${persistedId}/pdf` : null,
        exportAnonCta: !userId,
      }}
    />
  );
}

function TierLimitState() {
  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h2 className="font-serif text-3xl tracking-tight text-[#0f172a]">
        Llegó al límite de auditorías gratuitas
      </h2>
      <p className="max-w-md text-[#475569]">
        {AUDIT_FORM_ERRORS.limitReached}
      </p>
    </section>
  );
}

function AnonymousLimitState() {
  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h2 className="font-serif text-3xl tracking-tight text-[#0f172a]">
        {ANONYMOUS_AUDIT_LIMIT_COPY.title}
      </h2>
      <p className="max-w-md text-[#475569]">
        {ANONYMOUS_AUDIT_LIMIT_COPY.body}
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
      <h2 className="font-serif text-3xl tracking-tight text-[#0f172a]">
        No pudimos analizar el sitio
      </h2>
      <p className="max-w-md text-[#475569]">{copy}</p>
      <a
        href={`/report?url=${encodeURIComponent(url)}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Reintentar
      </a>
    </section>
  );
}
