import type { FetchErrorCode } from "@/lib/contracts/fetch-types";
import { FETCH_ERROR_COPY, GENERIC_AUDIT_ERROR_COPY } from "@/lib/copy";

export { FETCH_ERROR_COPY, GENERIC_AUDIT_ERROR_COPY };

/**
 * A fetch failure that `runAudit` throws for: any typed `FetchErrorCode`
 * (page fetch layer, RFL-11) plus the non-HTML reason that would otherwise be
 * thrown at the audit boundary.
 */
export type FetchFailureCode = FetchErrorCode | "unsupported_content_type";

const FETCH_FAILURE_CODES = Object.keys(FETCH_ERROR_COPY) as FetchFailureCode[];

/**
 * Detects the fetch failure code embedded in the `runAudit` throw message
 * (format: `audit page fetch failed for <url>: <CODE>: <detail>`; the
 * unsupported reason uses `<reason> (<contentType>)`). Returns null when the
 * error is not a known fetch failure — callers then rethrow to the boundary.
 */
export function detectFetchFailureCode(
  message: string,
): FetchFailureCode | null {
  const found = FETCH_FAILURE_CODES.find(
    (code) => message.includes(`${code}:`) || message.includes(`${code} (`),
  );
  return found ?? null;
}

/** Maps an unknown error to the Spanish copy of its fetch failure code. */
export function resolveFetchErrorCopy(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = detectFetchFailureCode(message);
  return code === null ? GENERIC_AUDIT_ERROR_COPY : FETCH_ERROR_COPY[code];
}
