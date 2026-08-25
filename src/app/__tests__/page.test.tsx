import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import Page from "@/app/page";

// The landing page wires AuditForm to auditAction, which calls auth() for the
// tier pre-check (TLM-3). next-auth/lib/env.js imports next/server
// (unresolvable in vitest), so the module is mocked; the auth behavior itself
// is covered in src/lib/audit/__tests__/actions.test.ts.
//
// LND-6 (sprint 8): the Home page itself resolves auth() to adapt the CTA —
// an anonymous session (default) keeps the signup CTA; an active session
// shows "Ir al dashboard". The mock is hoisted and typed as
// `() => Promise<Session | null>` so the LND-6 scenarios can override it.
const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async (): Promise<Session | null> => null),
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

/** Minimal active session for the LND-6 authenticated scenarios. */
const SESSION: Session = {
  expires: new Date(Date.now() + 60_000).toISOString(),
  user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
};

/** Home is an async server component (awaits auth()) — render the resolved JSX. */
async function renderPage() {
  return render(await Page());
}

/**
 * U2.T4 — Landing page (LND-1..6, ADF-1/8): full marketing landing that drives
 * the real audit flow and explains the product with the five real domains, the
 * real severity bands, the six AI platforms, and a pricing teaser. The CTA
 * adapts to the auth session (LND-6).
 */
describe("landing page (LND-1..5, ADF-1/ADF-8)", () => {
  it("renders the GeoAudit hero heading", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "motores de IA",
    );
  });

  it("renders the real URL audit form (LND-1)", async () => {
    await renderPage();
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
    // The real form submits to the real action.
    expect(
      screen.getByRole("button", { name: /auditar/i }),
    ).toBeInTheDocument();
  });

  it("presents the five real audit domains (LND-2)", async () => {
    await renderPage();
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

  it("shows five numbered contrast cards with Gemini hex surfaces (LND-2)", async () => {
    await renderPage();
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

  it("renders card 03 on dark navy #0f172a with an emerald number (LND-2)", async () => {
    await renderPage();
    const number03 = screen.getByText("03");
    const numberContainer = number03.closest("div");
    expect(numberContainer?.className).toContain("bg-emerald-500");
    const card = numberContainer?.closest("div[class*='#0f172a']");
    expect(card).not.toBeNull();
  });

  it("previews the five severity bands with Spanish labels (LND-3)", async () => {
    await renderPage();
    const table = screen
      .getByText("Escala de Bandas y Criterios Técnicos")
      .closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    for (const label of [
      "Excelente",
      "Bueno",
      "Regular",
      "Deficiente",
      "Crítico",
    ]) {
      expect(within(table as HTMLElement).getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the real band thresholds 90/75/60/40 (LND-3)", async () => {
    await renderPage();
    const table = screen
      .getByText("Escala de Bandas y Criterios Técnicos")
      .closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    for (const range of [
      "90 - 100",
      "75 - 89",
      "60 - 74",
      "40 - 59",
      "0 - 39",
    ]) {
      expect(within(table as HTMLElement).getByText(range)).toBeInTheDocument();
    }
  });

  it("renders a demo ScoreHero with the real severity band (LND-3)", async () => {
    await renderPage();
    const section = screen.getByText("Scorecard Unificado").closest("section");
    expect(section).not.toBeNull();
    const scorebox = within(section as HTMLElement)
      .getByText("GEO Score")
      .closest("div.overflow-hidden");
    expect(scorebox).not.toBeNull();
    expect(within(scorebox as HTMLElement).getByText("92")).toBeInTheDocument();
    expect(
      within(scorebox as HTMLElement).getByText("/100"),
    ).toBeInTheDocument();
    // 92 falls in the REAL excellent band (≥90), not Gemini's 80+.
    expect(
      within(scorebox as HTMLElement).getByText("Excelente"),
    ).toBeInTheDocument();
    expect(
      within(section as HTMLElement).getByText("linear.app"),
    ).toBeInTheDocument();
  });

  it("shows the five demo categories with score, real band and weight (LND-3)", async () => {
    await renderPage();
    const table = screen
      .getByText("Desglose de ejemplo por categoría")
      .closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    expect(
      within(table as HTMLElement).getByText("AI Crawlers & robots.txt"),
    ).toBeInTheDocument();
    expect(
      within(table as HTMLElement).getByText("Alcance Multi-Modelo"),
    ).toBeInTheDocument();
    // weights from the Gemini demo (25/25/20/15/15).
    expect(
      within(table as HTMLElement).getAllByText(/25%|20%|15%/),
    ).toHaveLength(5);
    // Bands come from severityForScore (real thresholds): 95 → excellent,
    // 88/82/86/81 → good (75-89), so "Bueno" shows once per good category.
    expect(
      within(table as HTMLElement).getByText("Excelente"),
    ).toBeInTheDocument();
    expect(within(table as HTMLElement).getAllByText("Bueno")).toHaveLength(4);
  });

  it("names the six supported AI platforms (LND-4)", async () => {
    await renderPage();
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

  it("shows each platform card with its bot and company (LND-4)", async () => {
    await renderPage();
    const section = screen
      .getByText("6 plataformas de búsqueda generativa auditadas")
      .closest("section");
    expect(section).not.toBeNull();
    for (const bot of [
      "GPTBot / OAI-SearchBot",
      "ClaudeBot / Anthropic-AI",
      "PerplexityBot",
      "Google-Extended",
      "Googlebot Smartphone",
      "Bingbot / IndexNow",
    ]) {
      expect(within(section as HTMLElement).getByText(bot)).toBeInTheDocument();
    }
    for (const company of [
      "OpenAI",
      "Anthropic",
      "Perplexity AI",
      "Google",
      "Google Search",
      "Microsoft",
    ]) {
      expect(
        within(section as HTMLElement).getByText(company),
      ).toBeInTheDocument();
    }
  });

  it("teases pricing with a link to /pricing (LND-5)", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: /ver planes y precios/i }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("links the secondary CTA to /signup (LND-5)", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: /crear cuenta gratis/i }),
    ).toHaveAttribute("href", "/signup");
  });

  it("exposes no link to /dashboard for anonymous visitors (ADF-8)", async () => {
    await renderPage();
    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
  });
});

describe("landing page authenticated CTA (LND-6)", () => {
  it("shows 'Ir al dashboard' linking to /dashboard when authenticated", async () => {
    authMock.mockResolvedValueOnce(SESSION);
    await renderPage();

    expect(
      screen.getByRole("link", { name: "Ir al dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.queryByRole("link", { name: /crear cuenta gratis/i }),
    ).toBeNull();
  });

  it("keeps the 'Ver Planes y Precios' CTA when authenticated (LND-6)", async () => {
    authMock.mockResolvedValueOnce(SESSION);
    await renderPage();

    expect(
      screen.getByRole("link", { name: /ver planes y precios/i }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("shows 'Crear cuenta gratis' for anonymous visitors (LND-6)", async () => {
    authMock.mockResolvedValueOnce(null);
    await renderPage();

    expect(
      screen.getByRole("link", { name: /crear cuenta gratis/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Ir al dashboard" })).toBeNull();
  });
});
