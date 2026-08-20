import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingCards, type PricingPlan } from "@/billing/pricing-cards";

/**
 * U4.7 — PricingCards (PRC-1/2, design U4).
 *
 * Presentational card grid: renders the exact plan catalog (Free $0·3/30d,
 * Pro $9/mes·10/mes, Enterprise $49/mes·50/mes) with a per-plan CTA node the
 * server page supplies. The cards themselves carry no auth/billing logic.
 */

const defaultPlans: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    limit: "3 / 30 días",
    cta: "Comenzar",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$9/mes",
    limit: "10 / mes",
    cta: "Mejorar",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$49/mes",
    limit: "50 / mes",
    cta: "Hablar con ventas",
  },
];

function renderCards(plans: PricingPlan[] = defaultPlans) {
  return render(<PricingCards plans={plans} />);
}

describe("PricingCards (PRC-1)", () => {
  it("renders the three plan cards", () => {
    renderCards();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });
});

describe("PricingCards plan catalog (PRC-2)", () => {
  it("shows Free with $0 and 3/30d", () => {
    renderCards();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("3 / 30 días")).toBeInTheDocument();
  });

  it("shows Pro with $9/mes and 10/mes", () => {
    renderCards();
    expect(screen.getByText("$9/mes")).toBeInTheDocument();
    expect(screen.getByText("10 / mes")).toBeInTheDocument();
  });

  it("shows Enterprise with $49/mes and 50/mes", () => {
    renderCards();
    expect(screen.getByText("$49/mes")).toBeInTheDocument();
    expect(screen.getByText("50 / mes")).toBeInTheDocument();
  });

  it("renders each plan's CTA node", () => {
    renderCards();
    expect(screen.getByText("Comenzar")).toBeInTheDocument();
    expect(screen.getByText("Mejorar")).toBeInTheDocument();
    expect(screen.getByText("Hablar con ventas")).toBeInTheDocument();
  });
});
