import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import Page, { metadata as landingMetadata } from "@/app/page";
import { SCOREHERO_EVIDENCE } from "@/app/score-hero-evidence";
import { severityForScore } from "@/scoring/calculator";
import type { GeminiBand } from "@/ui/severity-badge";

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

/** Spanish label of a lowercase Gemini band (severity-badge BAND_LABELS). */
const BAND_LABELS: Record<GeminiBand, string> = {
  excellent: "Excelente",
  good: "Bueno",
  fair: "Regular",
  poor: "Deficiente",
  critical: "Crítico",
};

/** Home is an async server component (awaits auth()) — render the resolved JSX. */
async function renderPage() {
  return render(await Page());
}

/**
 * U2.T4 — Landing page (LND-1..6, ADF-1/8): full marketing landing that drives
 * the real audit flow and explains the product with the five real domains, the
 * real severity bands, the six AI platforms, and a final CTA that adapts to
 * the auth session (LND-6). The pricing teaser is gone (LND-6, sprint 10).
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

  it("renders a ScoreHero with the documented real evidence (LND-3/LND-7)", async () => {
    await renderPage();
    const section = screen.getByText("Scorecard Unificado").closest("section");
    expect(section).not.toBeNull();
    const scorebox = within(section as HTMLElement)
      .getByText("GEO Score")
      .closest("div.overflow-hidden");
    expect(scorebox).not.toBeNull();
    // The score is the DOCUMENTED evidence constant — never a hardcoded fake.
    expect(
      within(scorebox as HTMLElement).getByText(
        String(SCOREHERO_EVIDENCE.totalScore),
      ),
    ).toBeInTheDocument();
    expect(
      within(scorebox as HTMLElement).getByText("/100"),
    ).toBeInTheDocument();
    // Domain appears in the mono chip AND as the serif title (the adapter
    // sets title = domain) — assert at least one, never a hardcoded value.
    expect(
      within(scorebox as HTMLElement).getAllByText(SCOREHERO_EVIDENCE.domain)
        .length,
    ).toBeGreaterThan(0);
    // The band chip derives from the REAL thresholds (90/75/60/40) — the demo
    // can never claim "Excelente" for a score that is not ≥90.
    const expectedBand = severityForScore(
      SCOREHERO_EVIDENCE.totalScore,
    ).toLowerCase() as GeminiBand;
    expect(
      within(scorebox as HTMLElement).getByText(BAND_LABELS[expectedBand]),
    ).toBeInTheDocument();
    // The summary line is the honest one from the evidence — real score + band.
    expect(
      within(scorebox as HTMLElement).getByText(SCOREHERO_EVIDENCE.summary),
    ).toBeInTheDocument();
  });

  it("renders the category breakdown only from real evidence (LND-7)", async () => {
    await renderPage();
    const header = screen.queryByText("Desglose por categoría");
    if (SCOREHERO_EVIDENCE.categoryScores.length === 0) {
      // A3.2: evidence pending — no invented per-dimension numbers are shown.
      expect(header).toBeNull();
      return;
    }
    // Evidence fixed: the breakdown mirrors the verified GeminiView categories.
    expect(header).not.toBeNull();
    const table = header?.closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    for (const category of SCOREHERO_EVIDENCE.categoryScores) {
      expect(
        within(table as HTMLElement).getByText(category.name),
      ).toBeInTheDocument();
      expect(
        within(table as HTMLElement).getByText(String(category.score)),
      ).toBeInTheDocument();
      // Two dimensions share the 12.5% weight — use the AllBy variant.
      expect(
        within(table as HTMLElement).getAllByText(category.weight ?? "").length,
      ).toBeGreaterThan(0);
    }
  });

  it("never shows invented demo data (old 92/linear 'excelente' demo, LND-7)", async () => {
    await renderPage();
    // The fabricated 92 and its invented marketing copy are gone.
    expect(screen.queryByText("92")).toBeNull();
    expect(
      screen.queryByText(
        /Excelente visibilidad e indexación en modelos generativos/,
      ),
    ).toBeNull();
    expect(screen.queryByText("Desglose de ejemplo por categoría")).toBeNull();
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

  it("renders no pricing teaser or /pricing link (LND-6)", async () => {
    await renderPage();
    // The /pricing route is deleted (WU-1) — the landing must not link it.
    const pricingLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/pricing");
    expect(pricingLinks).toHaveLength(0);
    expect(screen.queryByText(/ver planes y precios/i)).not.toBeInTheDocument();
  });

  it("links the anonymous CTA 'Auditar gratis' to /signup (LND-6)", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: /auditar gratis/i }),
    ).toHaveAttribute("href", "/signup");
  });

  it("exposes no link to /dashboard for anonymous visitors (ADF-8)", async () => {
    await renderPage();
    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
  });

  // LND-9 (sprint 9): inline Organization + WebSite JSON-LD in the SSR HTML —
  // the schema engine only detects blocks in the server-rendered source.
  it("emits inline Organization and WebSite JSON-LD in the SSR HTML (LND-9)", async () => {
    const { container } = await renderPage();
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const payloads = [...scripts].map((script) =>
      JSON.parse(script.textContent ?? ""),
    );
    const types = payloads.map((payload) => payload["@type"]).sort();
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    const org = payloads.find((payload) => payload["@type"] === "Organization");
    expect(org.name).toBe("GeoAudit");
    expect(org.url).toMatch(/^https?:\/\//);
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.sameAs.length).toBeGreaterThan(0);
    const site = payloads.find((payload) => payload["@type"] === "WebSite");
    expect(site.potentialAction).toBeDefined();
  });

  // LND-12 (sprint 9): E-E-A-T trust signals — external citations to authority
  // domains (the authoritativeness engine rewards absolute http(s) links and
  // known authority hosts). The contact link lives in the Footer (tested in
  // src/ui/__tests__/footer.test.tsx — this render covers <main> only).
  it("surfaces external authority citations (LND-12)", async () => {
    await renderPage();
    // Authoritativeness: at least 5 absolute external links, including
    // known authority domains (w3.org, github.com, openai.com, anthropic.com,
    // developer.mozilla.org).
    const external = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter(
        (href): href is string =>
          typeof href === "string" && /^https?:\/\//.test(href),
      );
    expect(external.length).toBeGreaterThanOrEqual(5);
    const authorityHosts = [
      "w3.org",
      "github.com",
      "openai.com",
      "anthropic.com",
      "developer.mozilla.org",
    ];
    const matched = external.filter((href) =>
      authorityHosts.some((host) => href.includes(host)),
    );
    expect(matched.length).toBeGreaterThanOrEqual(5);
  });
});

describe("landing page metadata (LND-8)", () => {
  it("emits OpenGraph metadata with title, description, url and the shared og.png", () => {
    expect(landingMetadata.openGraph).toMatchObject({
      title: "Auditoría de visibilidad en motores de IA",
      url: "/",
      siteName: "Relevy",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    });
    expect(landingMetadata.openGraph?.description).toContain("GEO Score");
  });

  it("emits a summary_large_image Twitter card referencing og.png", () => {
    expect(landingMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og.png"],
    });
  });
});

describe("landing page authenticated CTA (LND-6)", () => {
  it("shows 'Ir al dashboard' linking to /dashboard when authenticated", async () => {
    authMock.mockResolvedValueOnce(SESSION);
    await renderPage();

    expect(
      screen.getByRole("link", { name: "Ir al dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: /auditar gratis/i })).toBeNull();
  });

  it("shows no pricing link when authenticated (LND-6)", async () => {
    authMock.mockResolvedValueOnce(SESSION);
    await renderPage();

    const pricingLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/pricing");
    expect(pricingLinks).toHaveLength(0);
  });

  it("shows 'Auditar gratis' for anonymous visitors (LND-6)", async () => {
    authMock.mockResolvedValueOnce(null);
    await renderPage();

    expect(
      screen.getByRole("link", { name: /auditar gratis/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Ir al dashboard" })).toBeNull();
  });
});
