import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PricingPage, { metadata as pricingMetadata } from "@/app/pricing/page";

const { authMock, userFindUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

// next-auth/lib/env.js imports next/server (unresolvable in vitest), so auth is
// mocked; prisma returns a FREE tier so the paid CTAs render as the real
// CheckoutButton. The billing actions module is mocked (same pattern as the
// dashboard test) to keep the Stripe stack out of the page test — the real
// checkoutAction/portalAction behavior is covered in billing/__tests__/actions.
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: userFindUniqueMock } },
}));
vi.mock("@/billing/actions", () => ({
  checkoutAction: vi.fn(async () => ({ error: null })),
  portalAction: vi.fn(async () => ({ error: null })),
}));

/**
 * U3.2/U3.3 — Pricing page (PRC-2/3/5/6/7, design U3, DNF-9).
 *
 * Gemini composition: header (eyebrow "Planes Transparentes" + serif H1),
 * monthly-only catalog (no annual toggle / no -17%, PRC-5), Pro highlighted
 * (PRC-6, covered by pricing-cards), and the FAQ section answering billing
 * cycle / cancellation / plan changes (PRC-7) plus product questions. The page
 * keeps wiring the checkout/portal Server Actions through CheckoutButton
 * (PRC-3). Styles are hex directos — no semantic token classes (DNF-9).
 */
async function renderPage() {
  // RSC async page: await it, then render the resolved elements (dashboard
  // test pattern).
  return render(await PricingPage());
}

describe("pricing page (PRC-2/5/7)", () => {
  it("renders the Gemini header verbatim", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    await renderPage();
    expect(screen.getByText("Planes Transparentes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Optimiza la citabilidad de tu producto en la era de la IA",
    );
    expect(screen.getByText(/Sin sorpresas/)).toBeInTheDocument();
  });

  it("renders the real monthly plan catalog (PRC-2)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    await renderPage();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$9/mes")).toBeInTheDocument();
    expect(screen.getByText("$49/mes")).toBeInTheDocument();
    expect(screen.getByText("3 / 30 días")).toBeInTheDocument();
    expect(screen.getByText("10 / mes")).toBeInTheDocument();
    expect(screen.getByText("50 / mes")).toBeInTheDocument();
  });

  it("renders monthly-only — no annual toggle nor -17% (PRC-5, D2)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    await renderPage();
    expect(screen.queryByText(/-17%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/anual/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/facturación anual/i)).not.toBeInTheDocument();
  });

  it("renders the FAQ section answering billing questions (PRC-7)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    await renderPage();
    expect(screen.getByText("Preguntas Frecuentes")).toBeInTheDocument();
    // Billing cycle, cancellation and plan changes are answered.
    expect(
      screen.getByText("¿Cómo funciona la facturación?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /se facturan mensualmente y se renuevan de forma automática/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("¿Puedo cancelar en cualquier momento?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/sin penalizaciones/)).toBeInTheDocument();
    expect(screen.getByText("¿Puedo cambiar de plan?")).toBeInTheDocument();
    expect(screen.getByText(/prorrateo automático/)).toBeInTheDocument();
    // Real product questions (GEO Score, platforms, multi-page, PDF).
    expect(screen.getByText("¿Qué es el GEO Score?")).toBeInTheDocument();
    expect(screen.getByText("¿Qué plataformas analiza?")).toBeInTheDocument();
    expect(
      screen.getByText("¿Puedo auditar varias páginas?"),
    ).toBeInTheDocument();
    expect(screen.getByText("¿Cómo funciona el PDF?")).toBeInTheDocument();
  });
});

describe("pricing page CTAs (PRC-3)", () => {
  it("shows 'Plan activo' on the Free card for a FREE user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    await renderPage();
    expect(screen.getByText("Plan activo")).toBeInTheDocument();
  });

  it("keeps the checkout/portal action wiring through CheckoutButton", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const { container } = await renderPage();
    // Both paid cards render a checkout form carrying the plan in a hidden input.
    const planInputs = container.querySelectorAll('input[name="plan"]');
    expect(planInputs).toHaveLength(2);
    expect(Array.from(planInputs).map((i) => i.getAttribute("value"))).toEqual([
      "PRO",
      "ENTERPRISE",
    ]);
    expect(screen.getAllByText("Mejorar")).toHaveLength(2);
  });

  it("renders the portal CTA for an active PRO user (portalAction intact)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "PRO" });
    await renderPage();
    expect(screen.getByText("Plan activo")).toBeInTheDocument();
    expect(screen.getByText("Gestionar suscripción")).toBeInTheDocument();
  });
});

describe("pricing page hex classes (DNF-9, U3.3)", () => {
  it("uses hex classes only — no semantic token classes", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const { container } = await renderPage();
    expect(container.innerHTML).not.toMatch(
      /text-navy|bg-navy|bg-surface(?!-)|text-text-primary|text-text-secondary|border-border|bg-surface-muted/,
    );
  });
});

describe("pricing page metadata (PRC-8)", () => {
  it("emits OpenGraph metadata with title, description, url and the shared og.png", () => {
    expect(pricingMetadata.openGraph).toMatchObject({
      title: "Planes y precios",
      url: "/pricing",
      siteName: "GeoAudit",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    });
    expect(pricingMetadata.openGraph?.description).toContain(
      "auditorías gratuitas",
    );
  });

  it("emits a summary_large_image Twitter card referencing og.png", () => {
    expect(pricingMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og.png"],
    });
  });
});
