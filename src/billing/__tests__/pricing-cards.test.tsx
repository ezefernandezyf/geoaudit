import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingCards, type PricingPlan } from "@/billing/pricing-cards";

/**
 * U3.1/U3.3 — PricingCards (PRC-1/2/5/6, design U3, DNF-9).
 *
 * Presentational card grid: renders the exact monthly plan catalog (Free
 * $0·3/30d, Pro $9/mes·10/mes, Enterprise $49/mes·50/mes) with a per-plan CTA
 * node the server page supplies. Monthly-only (PRC-5): the cards never render
 * an annual toggle or a discounted annual price — the catalog is monthly by
 * design. Pro is highlighted Gemini-style (PRC-6): emerald border
 * `border-[#10b981]`, "Recomendado" badge and `lg:-translate-y-2` lift.
 * Styles are hex directos — no semantic token classes (DNF-9).
 */

const defaultPlans: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    limit: "3 / 30 días",
    description: "Para probar la visibilidad de su dominio principal.",
    features: ["3 auditorías GEO por 30 días", "GEO Score completo 0-100"],
    cta: "Comenzar",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$9/mes",
    limit: "10 / mes",
    description: "Para equipos que optimizan visibilidad generativa mensual.",
    features: [
      "10 auditorías por mes",
      "Auditoría multi-página",
      "Exportar PDF",
    ],
    featured: true,
    cta: "Mejorar",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "$49/mes",
    limit: "50 / mes",
    description: "Para agencias y marcas con volumen de auditorías.",
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

  it("renders each plan description (Gemini composition)", () => {
    renderCards();
    expect(
      screen.getByText("Para probar la visibilidad de su dominio principal."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Para equipos que optimizan visibilidad generativa mensual.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Para agencias y marcas con volumen de auditorías."),
    ).toBeInTheDocument();
  });

  it("labels each feature list with 'Incluye:' (Gemini verbatim)", () => {
    renderCards();
    expect(screen.getAllByText("Incluye:")).toHaveLength(3);
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
    expect(screen.getByText("Auditoría multi-página")).toBeInTheDocument();
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

describe("PricingCards highlighted plan (PRC-6, DNF-9)", () => {
  it("highlights Pro with emerald border, badge and lift (Gemini hex)", () => {
    renderCards();
    const proCard = screen.getByText("Pro").closest("div.rounded-2xl");
    expect(proCard?.className).toContain("border-2");
    expect(proCard?.className).toContain("border-[#10b981]");
    expect(proCard?.className).toContain("lg:-translate-y-2");

    const badge = screen.getByText("Recomendado").closest("div");
    expect(badge?.className).toContain("bg-[#047857]");
    expect(badge?.className).toContain("text-white");
  });

  it("keeps non-featured cards on the muted border hex", () => {
    renderCards();
    const freeCard = screen.getByText("Free").closest("div.rounded-2xl");
    expect(freeCard?.className).toContain("border-[#e2e8f0]");
    expect(freeCard?.className).not.toContain("border-2");
  });

  it("does not render a badge when no plan is featured", () => {
    renderCards([
      { id: "PRO", name: "Pro", price: "$9/mes", limit: "10 / mes", cta: "x" },
    ]);
    expect(screen.queryByText("Recomendado")).not.toBeInTheDocument();
  });

  it("uses hex classes only — no semantic token classes (DNF-9)", () => {
    const { container } = renderCards();
    expect(container.innerHTML).not.toMatch(
      /text-navy|text-text-primary|text-text-secondary|border-border|bg-surface-muted|bg-emerald(?!-)|border-emerald(?!-)/,
    );
  });
});
