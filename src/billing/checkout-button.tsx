"use client";

import { useActionState } from "react";
import { Button } from "@/ui/button";
import type { BillingActionState } from "@/billing/actions";

/**
 * Checkout/Portal action UX wrapper (PRC-4, design U4).
 *
 * A `"use client"` form around `useActionState(action)` exposing the required
 * action UX states: idle (neutral — no alert, enabled button), loading (Button
 * pending + aria-busy) and error (rendered with `role="alert"`). Success IS the
 * redirect (the action throws NEXT_REDIRECT), so there is no in-page success
 * state (PRC-4).
 *
 * The `plan` value is carried in a hidden input so the Server Action receives
 * it through FormData, matching `checkoutAction`'s contract.
 */

/** Server Action signature consumed by useActionState (mirrors billing/actions). */
export type CheckoutAction = (
  prev: BillingActionState,
  formData: FormData,
) => Promise<BillingActionState>;

/** Maps action error codes to friendly Spanish copy (PRC-4). */
const ERROR_COPY: Record<string, string> = {
  auth: "Necesitás iniciar sesión para gestionar tu plan.",
  "invalid-plan": "Plan no válido.",
  config: "No pudimos iniciar el pago. Probá de nuevo en unos minutos.",
  "no-subscription": "No tenés una suscripción activa.",
};

/** Resolve an action error code to user-facing copy (falls back to the code). */
export function billingErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return ERROR_COPY[code] ?? code;
}

type CheckoutButtonProps = {
  /** The Server Action to run on submit (checkoutAction or portalAction). */
  action: CheckoutAction;
  /** Checkout plan carried in the form (ignored by portalAction). */
  plan: "PRO" | "ENTERPRISE";
  /** Button label (e.g. "Mejorar" / "Gestionar suscripción"). */
  label?: string;
};

export function CheckoutButton({
  action,
  plan,
  label = "Mejorar",
}: CheckoutButtonProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });
  const error = billingErrorMessage(state.error);

  return (
    <form action={formAction} aria-busy={isPending || undefined}>
      <input type="hidden" name="plan" value={plan} />
      <Button type="submit" loading={isPending} className="w-full">
        {label}
      </Button>
      {error ? (
        <p
          role="alert"
          className="mt-3 border border-red/30 bg-red/10 px-3 py-2 text-sm text-red"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
