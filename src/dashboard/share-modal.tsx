"use client";

import { useActionState, useState } from "react";
import { Button } from "@/ui/button";
import type {
  ShareLinkAction,
  ShareLinkState,
} from "@/lib/audit/share-actions";

/**
 * ShareModal (SHR-3/7, ADP-8, design ShareModal). A PRO-gated dialog on the
 * audit detail page that replaces the inline panel: the "Compartir reporte"
 * trigger opens a modal with create → copy → revoke.
 *
 * The two share Server Actions are injected as props (the BillingCta →
 * CheckoutButton pattern: the page imports the `"use server"` functions and
 * injects them; this component never imports them client-side). The audit id
 * travels in hidden inputs; the USER id always comes from the session inside
 * the actions. The page only renders this modal when `requirePaidTier` allows
 * it — FREE users see the upgrade CTA instead (TLM-9).
 *
 * UX states (STYLE-BRIEF §9): idle — create form when no token, URL + copy +
 * revoke when one exists; loading — `aria-busy` + disabled submit; success —
 * the `/share/[token]` URL + copy; error — action error code mapped to copy
 * with `role="alert"`.
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

type ShareModalProps = {
  auditId: string;
  /** Existing share token (null = no active link yet). */
  initialToken: string | null;
  /** createShareToken Server Action (injected by the page). */
  createAction: ShareLinkAction;
  /** revokeShareToken Server Action (injected by the page). */
  revokeAction: ShareLinkAction;
};

export function ShareModal({
  auditId,
  initialToken,
  createAction,
  revokeAction,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function handleCopy() {
    if (!token) return;
    navigator.clipboard?.writeText(shareUrlFor(token));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Compartir reporte</Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compartir reporte"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-xl tracking-tight text-navy">
                Compartir reporte
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar ventana"
                className="rounded-md px-2 py-1 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm text-text-secondary">
              Cualquiera con el link puede ver este reporte. Revocarlo lo vuelve
              inaccesible al instante.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              {token ? (
                <>
                  <code className="block break-all rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-text-primary">
                    {shareUrlFor(token)}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCopy}
                      className="flex-1"
                    >
                      {copied ? "Copiado" : "Copiar enlace"}
                    </Button>
                    <form
                      action={revokeFormAction}
                      aria-label="Revocar link de share"
                      aria-busy={revoking || undefined}
                    >
                      <input type="hidden" name="auditId" value={auditId} />
                      <Button
                        type="submit"
                        variant="danger"
                        disabled={revoking}
                      >
                        Revocar
                      </Button>
                    </form>
                  </div>
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

            <div className="mt-5 flex justify-end border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
