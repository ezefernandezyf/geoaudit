import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { billingErrorMessage, CheckoutButton } from "@/billing/checkout-button";
import type { CheckoutAction } from "@/billing/checkout-button";

/**
 * U4.9 — CheckoutButton (PRC-4, design U4).
 *
 * "use client" component wrapping `useActionState(checkoutAction)`: it exposes
 * the required action UX states — idle (neutral, no alert), loading (Button
 * pending) and error (role="alert", no redirect). Success IS the redirect
 * (the action throws NEXT_REDIRECT), so there is no in-page success state.
 */

const okAction: CheckoutAction = async () => ({ error: null });

describe("CheckoutButton idle state (PRC-4)", () => {
  it("renders a submit button with the plan and no alert", () => {
    render(<CheckoutButton action={okAction} plan="PRO" />);
    const button = screen.getByRole("button", { name: "Mejorar" });
    expect(button).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CheckoutButton loading state (PRC-4)", () => {
  it("disables the button and shows the loading label while pending", async () => {
    let release!: (state: { error: string | null }) => void;
    const pendingAction: CheckoutAction = () =>
      new Promise((resolve) => {
        release = resolve;
      });

    render(<CheckoutButton action={pendingAction} plan="PRO" />);
    fireEvent.click(screen.getByRole("button", { name: "Mejorar" }));

    const button = screen.getByRole("button", { name: "Analizando…" });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      release({ error: null });
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Mejorar" }),
      ).not.toBeDisabled(),
    );
  });
});

describe("CheckoutButton error state (PRC-4)", () => {
  it("surfaces the action error with role=alert", async () => {
    const failingAction: CheckoutAction = async () => ({ error: "config" });
    render(<CheckoutButton action={failingAction} plan="PRO" />);

    fireEvent.click(screen.getByRole("button", { name: "Mejorar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      billingErrorMessage("config") ?? "config",
    );
  });
});
