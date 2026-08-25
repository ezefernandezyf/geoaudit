"use client";

import { useActionState, useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/ui/button";
import { SHARE_MODAL_ERROR_COPY } from "@/lib/copy";
import type {
  ShareLinkAction,
  ShareLinkState,
} from "@/lib/audit/share-actions";

/**
 * ShareModal (U5.9, ADP-7, design U5) — Gemini AuditDetailPage modal VERBATIM
 * (hex surfaces, rounded-2xl panel, emerald icon header) over the REAL share
 * actions: `createShareToken` / `revokeShareToken` are injected as props (the
 * BillingCta → CheckoutButton pattern; the page imports the "use server"
 * functions, this client component never does). The audit id travels in
 * hidden inputs; the USER id always comes from the session inside the actions.
 *
 * Real actions (ADP-7):
 * - Copiar: navigator.clipboard with the real public URL of the token.
 * - Compartir en X / LinkedIn / WhatsApp: real share intents (window.open)
 *   against the same public URL.
 * - Ver vista pública: navigates to `/share/{token}` (the real route).
 * - Revocar enlace / Activar enlace: the two real Server Actions.
 *
 * Error copy: single source of truth from copy.ts (neutral Spanish).
 */
const ERROR_COPY = SHARE_MODAL_ERROR_COPY;

function shareUrlFor(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

/** Real share-intent URLs (X / LinkedIn / WhatsApp) for a public report. */
function shareIntentUrl(kind: "x" | "linkedin" | "whatsapp", url: string) {
  const encoded = encodeURIComponent(url);
  switch (kind) {
    case "x":
      return `https://twitter.com/intent/tweet?url=${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
    case "whatsapp":
      return `https://wa.me/?text=${encoded}`;
  }
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
  const shareUrl = token ? shareUrlFor(token) : null;

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  function handleShare(kind: "x" | "linkedin" | "whatsapp") {
    if (!shareUrl) return;
    window.open(
      shareIntentUrl(kind, shareUrl),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        leftIcon={<Share2 className="h-3.5 w-3.5" aria-hidden="true" />}
      >
        Compartir reporte
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compartir reporte"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#0f172a]">
                  Compartir Reporte Público
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar ventana"
                className="rounded-md p-1 text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                ✕
              </button>
            </div>

            <p className="font-sans text-xs leading-relaxed text-[#475569]">
              Cualquier persona con este enlace podrá visualizar el GEO Score y
              los hallazgos sin necesidad de tener cuenta.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    Acceso público por enlace
                  </p>
                  <p className="text-[11px] text-[#64748b]">
                    {token
                      ? "Enlace activo y accesible"
                      : "Enlace revocado (404)"}
                  </p>
                </div>
                {token ? (
                  <form
                    action={revokeFormAction}
                    aria-label="Revocar link de share"
                    aria-busy={revoking || undefined}
                  >
                    <input type="hidden" name="auditId" value={auditId} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="danger"
                      disabled={revoking}
                    >
                      Revocar enlace
                    </Button>
                  </form>
                ) : (
                  <form
                    action={createFormAction}
                    aria-label="Activar link de share"
                    aria-busy={creating || undefined}
                  >
                    <input type="hidden" name="auditId" value={auditId} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="emerald"
                      disabled={creating}
                    >
                      Activar enlace
                    </Button>
                  </form>
                )}
              </div>

              {shareUrl ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    aria-label="URL pública del reporte"
                    className="flex-1 select-all rounded-md border border-[#cbd5e1] bg-[#f8fafc] p-2.5 font-mono text-xs text-[#0f172a]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCopy}
                    leftIcon={
                      copied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )
                    }
                  >
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              ) : null}

              {shareUrl ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-[11px] text-[#64748b]">
                    Compartir:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShare("x")}
                    aria-label="Compartir en X"
                    className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 font-mono text-[11px] font-semibold text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
                  >
                    X
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare("linkedin")}
                    aria-label="Compartir en LinkedIn"
                    className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 font-mono text-[11px] font-semibold text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare("whatsapp")}
                    aria-label="Compartir en WhatsApp"
                    className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 font-mono text-[11px] font-semibold text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
                  >
                    WhatsApp
                  </button>
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]"
                >
                  {ERROR_COPY[error]}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-3">
              {token ? (
                <a
                  href={`/share/${token}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                >
                  <span>Ver vista pública</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : (
                <span />
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
