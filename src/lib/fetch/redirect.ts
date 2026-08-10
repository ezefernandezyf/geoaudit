import type { FetchErrorCode } from "@/lib/contracts/fetch-types";

/**
 * Manual redirect loop (RFL-6): at most `MAX_REDIRECTS` hops, DNS re-validated
 * per hop through the injectable `validateHop`, https-only (scheme downgrades
 * and non-https targets rejected per the SSRF threat matrix).
 */

export const MAX_REDIRECTS = 5;

export type FetchImpl = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type HopValidator = (url: URL) => Promise<void>;

export type RedirectErrorCode = Extract<
  FetchErrorCode,
  "TOO_MANY_REDIRECTS" | "SSRF_BLOCKED" | "HTTP_STATUS"
>;

export class RedirectChainError extends Error {
  constructor(
    readonly code: RedirectErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RedirectChainError";
  }
}

export interface FollowRedirectsOptions {
  fetcher: FetchImpl;
  /** Re-validate DNS for the current hop (throws SsrfError on private IPs). */
  validateHop: HopValidator;
  timeoutMs: number;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function followRedirects(
  initialUrl: URL,
  options: FollowRedirectsOptions,
): Promise<Response> {
  const { fetcher, validateHop, timeoutMs } = options;
  let currentUrl = initialUrl;

  for (let hops = 0; ; hops++) {
    await validateHop(currentUrl);

    const response = await fetcher(currentUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!REDIRECT_STATUSES.has(response.status)) return response;

    if (hops >= MAX_REDIRECTS) {
      throw new RedirectChainError(
        "TOO_MANY_REDIRECTS",
        `redirect limit exceeded (${MAX_REDIRECTS} hops)`,
      );
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new RedirectChainError(
        "HTTP_STATUS",
        `HTTP ${response.status} redirect without a Location header`,
      );
    }

    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.protocol !== "https:") {
      throw new RedirectChainError(
        "SSRF_BLOCKED",
        `redirect to non-https scheme rejected: ${nextUrl.protocol}//${nextUrl.host}`,
      );
    }

    currentUrl = nextUrl;
  }
}
