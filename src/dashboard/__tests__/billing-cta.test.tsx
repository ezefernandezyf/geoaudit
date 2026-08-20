import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BillingCta } from "@/dashboard/billing-cta";
import type { CheckoutAction } from "@/billing/checkout-button";

/**
 * U4.11 — BillingCta (DSH-6, PRC-3, design U4).
 *
 * Tier-adaptive dashboard CTA: FREE → "Upgrade" linking to `/pricing`;
 * PRO/ENTERPRISE → "Gestionar suscripción" form that triggers the portal
 * action (no link). The server action is injected as a prop.
 */

const portalActionMock: CheckoutAction = vi.fn(async () => ({ error: null }));

describe("BillingCta (DSH-6)", () => {
  it("FREE: shows an Upgrade link to /pricing", () => {
    render(<BillingCta tier="FREE" portalAction={portalActionMock} />);
    const link = screen.getByRole("link", { name: "Upgrade" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("PRO: shows a Gestionar suscripción form (portal), not a link", () => {
    render(<BillingCta tier="PRO" portalAction={portalActionMock} />);
    const button = screen.getByRole("button", {
      name: "Gestionar suscripción",
    });
    expect(button).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("ENTERPRISE: shows the portal form (triangulation)", () => {
    render(<BillingCta tier="ENTERPRISE" portalAction={portalActionMock} />);
    expect(
      screen.getByRole("button", { name: "Gestionar suscripción" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
