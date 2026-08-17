/**
 * URL policy for the free audit flow (ADF-3/ADF-4, design U2).
 *
 * Pure helpers shared by the Server Action (server) and AuditForm (client).
 * Kept free of `next/navigation` and `"use server"` so the client bundle can
 * import this module without pulling in a server action module.
 */

/** Spanish error copy for the audit form — single source of truth (ADF-7). */
export const AUDIT_FORM_ERRORS = {
  invalidUrl: "Formato de URL inválido",
  protocol: "Solo URLs http/https",
} as const;

/**
 * ADF-3: only http/https schemes are allowed. The contract schema accepts any
 * valid URL (z.url does not filter schemes), so this filter is mandatory.
 * Malformed strings that cannot be parsed as URLs are rejected too.
 */
export function isAllowedProtocol(raw: string): boolean {
  try {
    const { protocol } = new URL(raw);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * ADF-4: silently upgrade http → https. Idempotent: re-normalizing an already
 * normalized URL is a no-op, matching the fetch layer's own http→https upgrade
 * (double normalization is safe by design).
 */
export function normalizeToHttps(raw: string): string {
  const url = new URL(raw);
  if (url.protocol === "http:") url.protocol = "https:";
  return url.toString();
}
