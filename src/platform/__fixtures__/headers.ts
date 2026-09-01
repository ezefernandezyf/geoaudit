/**
 * Prebuilt HTTP header variants for platform header analysis tests (RPL-1).
 * Plain Web Headers objects - no network involved.
 */

export const HEADERS_COMPLETE = new Headers({
  "content-type": "text/html; charset=utf-8",
  "x-robots-tag": "index, follow",
  link: '<https://example.com/>; rel="canonical"',
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "default-src 'self'",
});

/** Complete headers minus the canonical Link header (RPL-1 missing-canonical scenario). */
export const HEADERS_NO_CANONICAL = new Headers({
  "content-type": "text/html; charset=utf-8",
  "x-robots-tag": "index, follow",
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "default-src 'self'",
});
