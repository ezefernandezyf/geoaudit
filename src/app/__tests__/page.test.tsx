import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/page";

// The landing page wires AuditForm to auditAction, which calls auth() for the
// tier pre-check (TLM-3). next-auth/lib/env.js imports next/server
// (unresolvable in vitest), so the module is mocked; the auth behavior itself
// is covered in src/lib/audit/__tests__/actions.test.ts.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

/**
 * U2.T4 — Landing page (LND-1..5, ADF-1/8): full marketing landing that drives
 * the real audit flow and explains the product with the five real domains, the
 * real severity bands, the six AI platforms, and a pricing teaser.
 */
describe("landing page (LND-1..5, ADF-1/ADF-8)", () => {
  it("renders the GeoAudit hero heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "motores de IA",
    );
  });

  it("renders the real URL audit form (LND-1)", () => {
    render(<Page />);
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
    // The real form submits to the real action.
    expect(
      screen.getByRole("button", { name: /auditar/i }),
    ).toBeInTheDocument();
  });

  it("presents the five real audit domains (LND-2)", () => {
    render(<Page />);
    const section = screen
      .getByText("Metodología de análisis")
      .closest("section");
    expect(section).not.toBeNull();
    // The five real domains, none invented.
    for (const domain of [
      "Acceso de bots",
      "Citabilidad",
      "E-E-A-T",
      "Datos estructurados",
      "Plataforma",
    ]) {
      expect(
        within(section as HTMLElement).getByText(domain),
      ).toBeInTheDocument();
    }
    // No invented "density" domain.
    expect(
      within(section as HTMLElement).queryByText(/densidad de/gi),
    ).not.toBeInTheDocument();
  });

  it("shows five numbered contrast cards with Gemini hex surfaces (LND-2)", () => {
    render(<Page />);
    const section = screen
      .getByText("Metodología de análisis")
      .closest("section");
    expect(section).not.toBeNull();
    const numbers = within(section as HTMLElement).getAllByText(/^0[1-5]$/);
    expect(numbers).toHaveLength(5);
    // Light cards use the Gemini muted surface directly (no tokens).
    expect(
      section?.querySelectorAll("div[class*='#f8fafc']").length,
    ).toBeGreaterThanOrEqual(4);
    // No semantic token classes in the feature row.
    expect(section?.querySelector(".bg-surface-muted")).toBeNull();
  });

  it("renders card 03 on dark navy #0f172a with an emerald number (LND-2)", () => {
    render(<Page />);
    const number03 = screen.getByText("03");
    const numberContainer = number03.closest("div");
    expect(numberContainer?.className).toContain("bg-emerald-500");
    const card = numberContainer?.closest("div[class*='#0f172a']");
    expect(card).not.toBeNull();
  });

  it("previews the five severity bands with Spanish labels (LND-3)", () => {
    render(<Page />);
    for (const label of [
      "Excelente",
      "Bueno",
      "Regular",
      "Deficiente",
      "Crítico",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("names the six supported AI platforms (LND-4)", () => {
    render(<Page />);
    for (const platform of [
      "ChatGPT",
      "Claude",
      "Perplexity",
      "Gemini",
      "Google AI Overviews",
      "Bing Copilot",
    ]) {
      expect(screen.getByText(platform)).toBeInTheDocument();
    }
  });

  it("teases pricing with a link to /pricing (LND-5)", () => {
    render(<Page />);
    expect(
      screen.getByRole("link", { name: /ver planes y precios/i }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("exposes no link to /dashboard (ADF-8)", () => {
    render(<Page />);
    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
  });
});
