import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type {
  AuditResult,
  MultiPageResult,
} from "@/lib/contracts/audit-result";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";
import { MultiPageReport } from "@/report/multi-page-report";
import { SHARE_COPY } from "@/lib/copy";
import { Logo } from "@/ui/logo";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Discriminates the two persisted result shapes (same structural check as the
 * detail page): a multi-page audit persists the light `{ aggregate, pages }`
 * shape while single-page audits keep the full `AuditResult`. Without this, a
 * shared multi-page audit would dereference `summary`/`meta` undefined in the
 * report and crash (verify warning #4).
 */
function isMultiPageResult(value: unknown): value is MultiPageResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "aggregate" in value &&
    Array.isArray((value as { pages?: unknown }).pages)
  );
}

/** Hostname of the persisted URL for the verification banner (defensive). */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Public share page (U5.10, SHR-2/5/6/7/8/9, design U5). `/share/[token]`
 * renders a revocable, read-only report - deliberately OUTSIDE the auth
 * middleware matcher (`/dashboard/*` only): no `auth()`, no ownership check.
 *
 * Gemini SharePage composition VERBATIM over the real persisted row:
 * - SHR-7: "Verificado" pill (ShieldCheck) in the public header.
 * - SHR-8: the share token ID (mono) in the verification banner.
 * - SHR-9: footer CTA inviting the visitor to run their own audit.
 *
 * Lookup (SHR-6): `findUnique({ shareToken })` - a missing, null or unknown
 * token returns `null` → single `notFound()` (404) path.
 *
 * Render (SHR-2): the persisted `result` JSON is rendered through the shared
 * report components - the audit is NEVER re-run. The persisted date + token
 * travel through the adapter `ctx` (APT-9).
 *
 * Exposure (SHR-5): the query selects the audit row only (no user relation)
 * and the page passes ONLY the result + shareToken/date to the report -
 * `userId`, email and tier never reach the payload or the DOM.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const audit = await prisma.audit.findUnique({
    where: { shareToken: token },
  });
  if (!audit) {
    notFound();
  }

  const auditDate = audit.createdAt.toISOString();

  return (
    <div className="min-h-dvh bg-[#f8fafc] pb-16 font-sans text-[#0f172a]">
      {/* Minimalist public header - no app chrome, no billing buttons. */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Relevy brand (SHL-4): the shared Logo mark replaces the legacy
                "G" tile (mark-only; the wordmark text comes from the brand
                constant below, so the brand reads once). */}
            <Logo size={24} decorative showWordmark={false} />
            <div className="leading-none">
              <span className="block font-serif text-lg leading-none text-[#0f172a]">
                {BRAND_NAME}
              </span>
              <span className="font-mono text-[10px] text-[#64748b]">
                {SHARE_COPY.header.sub}
              </span>
            </div>
            <span className="ml-2 hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-800 sm:inline-flex">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              {SHARE_COPY.header.verified}
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0f172a] px-3 text-xs font-medium text-white shadow-xs transition-all duration-150 select-none whitespace-nowrap hover:bg-[#1e293b] active:scale-[0.98]"
          >
            <span>{SHARE_COPY.header.cta}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Main report body */}
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6">
        {/* Verification banner + token ID (SHR-7/8) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs text-[#475569]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span>
              {SHARE_COPY.banner.prefix}{" "}
              <strong className="font-mono text-[#0f172a]">
                {hostnameOf(audit.url)}
              </strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#94a3b8]">
            {SHARE_COPY.banner.idLabel} {audit.shareToken} • {auditDate}
          </span>
        </div>

        {isMultiPageResult(audit.result) ? (
          <MultiPageReport result={audit.result} />
        ) : (
          <AuditReport
            result={audit.result as unknown as AuditResult}
            ctx={{ auditDate, shareToken: audit.shareToken }}
          />
        )}

        {/* Footer CTA (SHR-9) */}
        <div className="mt-8 space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-8 text-center">
          <h3 className="font-serif text-2xl font-normal text-[#0f172a]">
            {SHARE_COPY.footer.title}
          </h3>
          <p className="mx-auto max-w-md text-xs text-[#64748b]">
            {SHARE_COPY.footer.body}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-[#0f172a] px-6 text-base font-medium text-white shadow-xs transition-all duration-150 select-none whitespace-nowrap hover:bg-[#1e293b] active:scale-[0.98]"
          >
            <span>{SHARE_COPY.footer.cta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}
