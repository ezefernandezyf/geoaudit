/**
 * Prebuilt X-Robots-Tag header variants for access-map tests (RCR-5).
 * Headers objects are plain Web Headers — no network involved.
 */

export function headersWith(xRobotsTag?: string): Headers {
  const headers = new Headers();
  if (xRobotsTag !== undefined) headers.set("x-robots-tag", xRobotsTag);
  return headers;
}

export const EMPTY_HEADERS = new Headers();
export const XRT_GLOBAL_NOINDEX = headersWith("noindex");
export const XRT_BOT_SCOPED_NOINDEX = headersWith("googlebot: noindex");
export const XRT_BOT_SCOPED_MULTI = headersWith("googlebot: noindex, nofollow");
export const XRT_GLOBAL_NOAI = headersWith("noai");
