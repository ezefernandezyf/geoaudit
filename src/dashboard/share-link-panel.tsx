"use client";

import { useActionState } from "react";
import { Button } from "@/ui/button";
import type {
  ShareLinkAction,
  ShareLinkState,
} from "@/lib/audit/share-actions";

/**
 * Share-link panel on the audit detail page (SHR-3/4, TLM-9, design D7).
 *
 * A `"use client"` wrapper around the two share Server Actions — received as
 * PROPS from the detail page (the BillingCta → CheckoutButton pattern: the
 * page imports the `"use server"` functions and injects them; this component
 * never imports them client-side). The audit id travels in hidden inputs; the
 * USER id always comes from the session inside the actions.
 *
 * UX states (STYLE-BRIEF §9): idle — create form when no token, URL + revoke
 * form when one exists; loading — `aria-busy` on the form + disabled submit
 * (Button's `loading` label is audit-specific, so share uses `disabled`);
 * success — the `/share/[token]` URL (built from the current origin); error —
 * action error code mapped to copy with `role="alert"`.
 *
 * The initial token comes from the server (`initialToken`): the audit the page
 * loaded already has a share link, so the panel opens in the revoke state.
 */

const ERROR_COPY: Record<string, string> = {
  auth: "Necesitás iniciar sesión para compartir.",
  "not-found": "No encontramos la auditoría.",
  upgrade: "Compartir es una función PRO. Mejorá tu plan para activarla.",
  failed: "No pudimos generar el link. Probá de nuevo en unos minutos.",
};

function shareUrlFor(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

type ShareLinkPanelProps = {
  auditId: string;
  /** Existing share token (null = no active link yet). */
  initialToken: string | null;
  /** createShareToken Server Action (injected by the page). */
  createAction: ShareLinkAction;
  /** revokeShareToken Server Action (injected by the page). */
  revokeAction: ShareLinkAction;
};

export function ShareLinkPanel({
  auditId,
  initialToken,
  createAction,
  revokeAction,
}: ShareLinkPanelProps) {
  const [createState, createFormAction, creating] = useActionState(
    createAction,
    { shareToken: null, error: null, revoked: false } satisfies ShareLinkState,
  );
  const [revokeState, revokeFormAction, revoking] = useActionState(
    revokeAction,
    { shareToken: null, error: null, revoked: false } satisfies ShareLinkState,
  );

  // A successful create wins; a successful revoke (revoked: true) clears the
  // token even when the server initialToken existed; otherwise fall back to
  // the server-provided initial token.
  const token =
    createState.shareToken ?? (revokeState.revoked ? null : initialToken);
  const error = createState.error ?? revokeState.error;

  return (
    <div className="flex flex-col gap-4">
      {token ? (
        <>
          <p className="text-sm text-text-secondary">
            Cualquiera con el link puede ver este reporte. Revocarlo lo vuelve
            inaccesible al instante.
          </p>
          <code className="block break-all rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-text-primary">
            {shareUrlFor(token)}
          </code>
          <form
            action={revokeFormAction}
            aria-label="Revocar link de share"
            aria-busy={revoking || undefined}
          >
            <input type="hidden" name="auditId" value={auditId} />
            <Button
              type="submit"
              variant="secondary"
              disabled={revoking}
              className="w-full"
            >
              Revocar
            </Button>
          </form>
        </>
      ) : (
        <form
          action={createFormAction}
          aria-label="Crear link de share"
          aria-busy={creating || undefined}
        >
          <input type="hidden" name="auditId" value={auditId} />
          <Button type="submit" disabled={creating} className="w-full">
            Crear link
          </Button>
        </form>
      )}
      {error ? (
        <p
          role="alert"
          className="border border-red/30 bg-red/10 px-3 py-2 text-sm text-red"
        >
          {ERROR_COPY[error]}
        </p>
      ) : null}
    </div>
  );
}
