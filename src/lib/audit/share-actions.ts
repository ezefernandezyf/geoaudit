"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Share-link Server Actions (SHR-1/3/4, design D4).
 *
 * Both actions follow the `(prevState, formData)` `"use server"` contract and
 * return a `ShareLinkState` for `useActionState` - failures are returned as an
 * error code (never thrown), so the panel can render them inline.
 *
 * SECURITY: the audit id travels in the form, but the USER id ALWAYS comes
 * from the session (`auth()`), never from the client - ownership is enforced
 * with the D2 scoped `findFirst { id, userId }`, so a missing or non-owned
 * audit collapses to the same `"not-found"` error (no existence leak).
 *
 * CREATE (SHR-3): ownership → `randomUUID()` (D4, node:crypto) → `update({
 * shareToken })`. There is no tier gate - every authenticated owner creates
 * the link (SHR-3).
 *
 * REVOKE (SHR-4): ownership → `update({ shareToken: null })` - nulling is
 * instant revocation; the public `/share/[token]` then 404s (SHR-6).
 */

/** Error codes returned instead of thrown, mapped to copy in the panel. */
export type ShareLinkErrorCode = "auth" | "not-found" | "failed";

/**
 * State consumed by useActionState. `revoked` discriminates a SUCCESSFUL
 * revoke (token nulled) from the untouched initial state - the panel must
 * distinguish "no action ran yet" (fall back to the server `initialToken`)
 * from "the link was revoked" (show the create form).
 */
export type ShareLinkState = {
  shareToken: string | null;
  error: ShareLinkErrorCode | null;
  /** true after a successful revoke - a nulled token beats any initialToken. */
  revoked: boolean;
};

/** Server Action signature (mirrors CheckoutAction / AuditAction). */
export type ShareLinkAction = (
  prev: ShareLinkState,
  formData: FormData,
) => Promise<ShareLinkState>;

/** Extracts the audit id from the submitted form (no user input is trusted). */
function auditIdFrom(formData: FormData): string {
  const id = formData.get("auditId");
  return typeof id === "string" ? id : "";
}

/**
 * Creates a revocable public share link (SHR-3): generates a `randomUUID()`
 * (D4) and persists it on the owned audit. No tier gate - every authenticated
 * owner can create the link. Returns the token; the panel builds the
 * `/share/[token]` URL client-side from the current origin.
 */
export async function createShareToken(
  _prev: ShareLinkState,
  formData: FormData,
): Promise<ShareLinkState> {
  const session = await auth();
  if (!session?.user?.id)
    return { shareToken: null, error: "auth", revoked: false };

  const audit = await prisma.audit.findFirst({
    where: { id: auditIdFrom(formData), userId: session.user.id },
  });
  if (!audit) return { shareToken: null, error: "not-found", revoked: false };

  const token = randomUUID();
  await prisma.audit.update({
    where: { id: audit.id },
    data: { shareToken: token },
  });

  return { shareToken: token, error: null, revoked: false };
}

/**
 * Revokes a share link (SHR-4): nulls `shareToken` for the owner - the token
 * is gone, so the public page 404s (SHR-6). No tier gate: removing access is
 * always allowed for the owner.
 */
export async function revokeShareToken(
  _prev: ShareLinkState,
  formData: FormData,
): Promise<ShareLinkState> {
  const session = await auth();
  if (!session?.user?.id)
    return { shareToken: null, error: "auth", revoked: false };

  const audit = await prisma.audit.findFirst({
    where: { id: auditIdFrom(formData), userId: session.user.id },
  });
  if (!audit) return { shareToken: null, error: "not-found", revoked: false };

  await prisma.audit.update({
    where: { id: audit.id },
    data: { shareToken: null },
  });

  return { shareToken: null, error: null, revoked: true };
}
