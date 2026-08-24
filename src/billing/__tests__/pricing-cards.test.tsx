import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingCards, type PricingPlan } from "@/billing/pricing-cards";

/**
 * U4.1/U4.2 — PricingCards (PRC-1/2/5, design U4).
 *
 * Presentational card grid: renders the exact monthly plan catalog (Free
 * $0·3/30d, Pro $9/mes·10/mes, Enterprise $49/mes·50/mes) with a per-plan CTA
 * node the server page supplies. Monthly-only (PRC-5): the cards never render
 * an annual toggle or a discounted annual price — the catalog is monthly by
 * design. Pro is highlighted with an emerald border + "Recomendado" badge.
 */

const defaultPlans: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    limit: "3 / 30 días",
    features: ["1 auditoría GEO por día", "Acceso a la landing"],
    cta: "Comenzar",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$9/mes",
    limit: "10 / mes",
    features: ["10 auditorías por mes", "Reporte multi-página", "Exportar PDF"],
    featured: true,
    cta: "Mejorar",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$49/mes",
    limit: "50 / mes",
    features: ["50 auditorías por mes", "Links de compartición"],
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

describe("PricingCards features (PRC-1)", () => {
  it("renders each plan's feature list", () => {
    renderCards();
    expect(screen.getByText("10 auditorías por mes")).toBeInTheDocument();
    expect(screen.getByText("Reporte multi-página")).toBeInTheDocument();
    expect(screen.getByText("Exportar PDF")).toBeInTheDocument();
  });
});

describe("PricingCards monthly-only (PRC-5)", () => {
  it("renders only monthly prices, never a discounted annual price", () => {
    renderCards();
    expect(screen.getByText("$9/mes")).toBeInTheDocument();
    expect(screen.getByText("$49/mes")).toBeInTheDocument();
    // No annual discounted price and no toggle label.
    expect(screen.queryByText(/-17%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/anual/i)).not.toBeInTheDocument();
  });
});

describe("PricingCards highlighted plan (PRC-1)", () => {
  it("shows the 'Recomendado' badge on the featured plan", () => {
    renderCards();
    expect(screen.getByText("Recomendado")).toBeInTheDocument();
  });

  it("does not render a badge when no plan is featured", () => {
    renderCards([
      { id: "PRO", name: "Pro", price: "$9/mes", limit: "10 / mes", cta: "x" },
    ]);
    expect(screen.queryByText("Recomendado")).not.toBeInTheDocument();
  });
});
