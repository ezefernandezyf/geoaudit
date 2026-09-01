import type { ProbeResult, SiteProbes } from "./types";

/**
 * Sitemap.xml / llms.txt presence probes (RPL-6, RPL-7) - informational
 * only (P5). Each probe issues a single HEAD request and reports
 * present/absent; the response body is never read or parsed. The fetcher is
 * injectable so tests never touch the network; probe failures are recorded
 * as typed errors, never thrown.
 *
 * An optional `signal` bounds the worst-case latency (ARU-9): a hung host
 * aborts instead of hanging past the function timeout. When the signal fires
 * the probe records a controlled error - it is never left pending.
 */

export type ProbeFn = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function probeResource(
  url: string,
  fetcher: ProbeFn = fetch,
  signal?: AbortSignal,
): Promise<ProbeResult> {
  try {
    const response = await fetcher(url, {
      method: "HEAD",
      redirect: "follow",
      signal,
    });
    return {
      url,
      run: true,
      present: response.ok,
      statusCode: response.status,
      error: null,
    };
  } catch (error) {
    return {
      url,
      run: false,
      present: false,
      statusCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Runs the sitemap + llms.txt probes in parallel for an origin (RPL-6 + RPL-7). */
export async function probeSite(
  origin: string,
  fetcher: ProbeFn = fetch,
  signal?: AbortSignal,
): Promise<SiteProbes> {
  const base = origin.replace(/\/+$/, "");
  const [sitemap, llmsTxt] = await Promise.all([
    probeResource(`${base}/sitemap.xml`, fetcher, signal),
    probeResource(`${base}/llms.txt`, fetcher, signal),
  ]);
  return { sitemap, llmsTxt };
}
