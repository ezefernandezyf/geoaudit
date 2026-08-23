import { load } from "cheerio";
import type { FetchError, FetchResult } from "@/lib/contracts/fetch-types";
import { BodyTooLargeError, readBody } from "./body-reader";
import { decodeHtml } from "./charset";
import {
  followRedirects,
  RedirectChainError,
  type FetchImpl,
  type HopValidator,
} from "./redirect";
import { assertPublicHost, SsrfError, type LookupFn } from "./ssrf";

/**
 * Public fetch entry point (T7, RFL-1/RFL-4/RFL-5/RFL-8/RFL-11/RFL-12).
 * Composes the SSRF guard, manual redirect loop, content-type gate, bounded
 * body reader, and charset decoder into one never-throwing `FetchResult`.
 *
 * RFL-1: https only; http is upgraded to https; other schemes are rejected.
 * RFL-4/5: default timeouts per kind — 15000ms for 'page', 10000ms for 'probe'.
 * RFL-8: non-HTML Content-Type → `{ ok: false, reason: 'unsupported_content_type' }`.
 * RFL-11: every failure is a typed FetchResult error, never a thrown exception.
 * RFL-12: `fetcher` is injectable (defaults to the global fetch).
 */

export const PAGE_TIMEOUT_MS = 15_000;
export const PROBE_TIMEOUT_MS = 10_000;

/**
 * Fetch kinds (MPA-5, design D5): `"sitemap"` is scoped ONLY to sitemap probes
 * (sitemap discovery in `src/audit/multi-page.ts`) — it relaxes the RFL-8
 * content-type gate to accept XML without changing the page/probe gates.
 */
export type FetchKind = "page" | "probe" | "sitemap";

/**
 * P4 timeout resolution: explicit `timeoutMs` wins; otherwise the kind's
 * default applies (15000ms page / 10000ms probe — sitemaps are small files
 * like robots.txt, so they share the probe default). Pure so defaulting is
 * testable without wall-clock waits.
 */
export function resolveTimeoutMs(kind: FetchKind, timeoutMs?: number): number {
  if (timeoutMs !== undefined) return timeoutMs;
  return kind === "page" ? PAGE_TIMEOUT_MS : PROBE_TIMEOUT_MS;
}

export interface FetchAuditOptions {
  kind: FetchKind;
  /** Timeout per request hop; defaults to the kind's P4 value. */
  timeoutMs?: number;
  /** Decoded body size cap in bytes (RFL-7). */
  maxBytes: number;
  /** Injectable fetch implementation (RFL-12); defaults to global fetch. */
  fetcher?: FetchImpl;
  /**
   * Injectable DNS resolver for test isolation (zero network). Defaults to
   * node:dns via the SSRF guard; never needed by production callers.
   */
  lookup?: LookupFn;
}

function toFetchError(error: unknown): { ok: false; error: FetchError } {
  if (error instanceof SsrfError) {
    return {
      ok: false,
      error: { code: "SSRF_BLOCKED", message: error.message },
    };
  }
  if (error instanceof RedirectChainError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  if (error instanceof BodyTooLargeError) {
    return { ok: false, error: { code: "TOO_LARGE", message: error.message } };
  }
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT", message: error.message } };
    }
    const code = (error as { code?: unknown }).code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return {
        ok: false,
        error: { code: "DNS_FAILURE", message: error.message },
      };
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: { code: "NETWORK_ERROR", message } };
}

export async function fetchAuditResource(
  url: string,
  opts: FetchAuditOptions,
): Promise<FetchResult> {
  const fetcher = opts.fetcher ?? fetch;
  const timeoutMs = resolveTimeoutMs(opts.kind, opts.timeoutMs);

  // RFL-1: parse, upgrade http→https, reject any other scheme.
  let targetUrl: URL;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (parsed.protocol !== "https:") {
      return {
        ok: false,
        error: {
          code: "SSRF_BLOCKED",
          message: `non-https scheme rejected: ${parsed.protocol}//`,
        },
      };
    }
    targetUrl = parsed;
  } catch {
    return {
      ok: false,
      error: { code: "NETWORK_ERROR", message: `invalid URL: ${url}` },
    };
  }

  // RFL-2/RFL-3: DNS-resolve SSRF guard on every hop.
  const validateHop: HopValidator = (hop) =>
    assertPublicHost(hop.hostname, opts.lookup);

  // Track the last requested URL so the final redirect target is reported.
  let finalUrl = targetUrl.toString();
  const trackingFetcher: FetchImpl = (input, init) => {
    finalUrl = String(input);
    return fetcher(input, init);
  };

  let response: Response;
  try {
    // RFL-4/5: AbortSignal.timeout applied per hop; RFL-6: manual redirect loop.
    response = await followRedirects(targetUrl, {
      fetcher: trackingFetcher,
      validateHop,
      timeoutMs,
    });
  } catch (error) {
    return toFetchError(error);
  }

  // RFL-11: non-2xx final status is a typed error.
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      error: {
        code: "HTTP_STATUS",
        message: `HTTP ${response.status} for ${finalUrl}`,
      },
    };
  }

  // RFL-8: gate on content-type before reading any body. Pages must be
  // text/html; auxiliary probes additionally accept text/plain because real
  // robots.txt files are served with that Content-Type — gating them would
  // silently treat every robots directive as missing ("all allowed"). Sitemap
  // probes (MPA-5, D5) accept application/xml|text/xml ONLY — the RFL-8
  // relaxation is scoped to the `"sitemap"` kind; page/probe gates are
  // unchanged.
  const acceptedContentType =
    opts.kind === "page"
      ? /^text\/html\b/i
      : opts.kind === "sitemap"
        ? /^(?:application\/xml|text\/xml)\b/i
        : /^(?:text\/html|text\/plain)\b/i;
  const contentType = response.headers.get("content-type");
  if (!contentType || !acceptedContentType.test(contentType)) {
    return { ok: false, reason: "unsupported_content_type", contentType };
  }

  // RFL-7: bounded body read.
  let body: Uint8Array;
  try {
    body = await readBody(response.body, opts.maxBytes);
  } catch (error) {
    return toFetchError(error);
  }

  // RFL-9/RFL-10: charset resolution + decode, then build the parsed page.
  const decoded = decodeHtml(body, contentType);
  return {
    ok: true,
    parsed: {
      html: decoded.html,
      $: load(decoded.html),
      headers: response.headers,
      finalUrl,
      charset: decoded.charset,
      statusCode: response.status,
      contentType,
    },
  };
}
