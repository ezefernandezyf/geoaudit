import { urlInputSchema } from "@/lib/contracts/url-input";
import { isAllowedProtocol } from "@/lib/audit/url-policy";

/**
 * Search params shape of the report page (Next 15 passes a Promise of this).
 */
export type ReportSearchParams = Record<string, string | string[] | undefined>;

/**
 * Result of resolving `searchParams.url` (ARU-2/ARU-5): either a valid URL to
 * audit (Suspense branch) or the empty state, keeping the raw input so the
 * inline form can pre-fill it for user correction.
 */
export type ReportUrlResolution =
  { status: "valid"; url: string } | { status: "empty"; input: string };

/**
 * Pure decision function extracted from the report RSC (U3.T1, ARU-2/ARU-5).
 *
 * A URL is auditable only when it parses against the shared `urlInputSchema`
 * AND passes the http/https protocol filter (same policy as the landing
 * action). Missing, malformed or disallowed URLs fall back to the empty state
 * with the raw input for pre-filling the form.
 */
export function resolveReportUrl(
  searchParams: ReportSearchParams,
): ReportUrlResolution {
  const raw = searchParams.url;
  if (typeof raw !== "string" || raw.length === 0) {
    return { status: "empty", input: "" };
  }

  const parsed = urlInputSchema.safeParse({ url: raw });
  if (!parsed.success || !isAllowedProtocol(parsed.data.url)) {
    return { status: "empty", input: raw };
  }

  return { status: "valid", url: parsed.data.url };
}
