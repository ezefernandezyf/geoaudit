import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import Page, { metadata as landingMetadata } from "@/app/page";
import { SCOREHERO_EVIDENCE } from "@/app/score-hero-evidence";
import { LANDING_COPY } from "@/lib/copy";
import { ORG_SAME_AS } from "@/lib/brand";
import { severityForScore } from "@/scoring/calculator";
import type { GeminiBand } from "@/ui/severity-badge";

// The landing page wires AuditForm to auditAction, which calls auth() for the
// tier pre-check (TLM-3). next-auth/lib/env.js imports next/server
// (unresolvable in vitest), so the module is mocked; the auth behavior itself
// is covered in src/lib/audit/__tests__/actions.test.ts.
//
// LND-6 (sprint 8): the Home page itself resolves auth() to adapt the CTA -
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

/** Home is an async server component (awaits auth()) - render the resolved JSX. */
async function renderPage() {
  return render(await Page());
}

/**
 * U2.T4 - Landing page (LND-1..6, ADF-1/8): full marketing landing that drives
 * the real audit flow and explains the product with the five real domains, the
 * real severity bands, the six AI platforms, and a final CTA that adapts to
 * the auth session (LND-6). The pricing teaser is gone (LND-6, sprint 10).
 */
describe("landing page (LND-1..5, ADF-1/ADF-8)", () => {
  it("renders the Relevy hero heading", async () => {
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

  it("presents the six real audit domains (LND-2)", async () => {
    await renderPage();
    const section = screen
      .getByText("Metodología de análisis")
      .closest("section");
    expect(section).not.toBeNull();
    // The six real domains, none invented.
    for (const domain of [
      "Acceso de bots",
      "Citabilidad",
      "E-E-A-T",
      "Datos estructurados",
      "Plataforma",
      "Autoridad de marca",
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

  it("shows six numbered contrast cards with Gemini hex surfaces (LND-2)", async () => {
    await renderPage();
    const section = screen
      .getByText("Metodología de análisis")
      .closest("section");
    expect(section).not.toBeNull();
    const numbers = within(section as HTMLElement).getAllByText(/^0[1-6]$/);
    expect(numbers).toHaveLength(6);
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

  it("shows the real band thresholds 80/65/50/30 (LND-3)", async () => {
    await renderPage();
    const table = screen
      .getByText("Escala de Bandas y Criterios Técnicos")
      .closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    for (const range of [
      "80 - 100",
      "65 - 79",
      "50 - 64",
      "30 - 49",
      "0 - 29",
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
    // The score is the DOCUMENTED evidence constant - never a hardcoded fake.
    expect(
      within(scorebox as HTMLElement).getByText(
        String(SCOREHERO_EVIDENCE.totalScore),
      ),
    ).toBeInTheDocument();
    expect(
      within(scorebox as HTMLElement).getByText("/100"),
    ).toBeInTheDocument();
    // Domain appears in the mono chip AND as the serif title (the adapter
    // sets title = domain) - assert at least one, never a hardcoded value.
    expect(
      within(scorebox as HTMLElement).getAllByText(SCOREHERO_EVIDENCE.domain)
        .length,
    ).toBeGreaterThan(0);
    // The band chip derives from the REAL thresholds (80/65/50/30) - the demo
    // can never claim "Excelente" for a score that is not ≥80.
    const expectedBand = severityForScore(
      SCOREHERO_EVIDENCE.totalScore,
    ).toLowerCase() as GeminiBand;
    expect(
      within(scorebox as HTMLElement).getByText(BAND_LABELS[expectedBand]),
    ).toBeInTheDocument();
    // The summary line is the honest one from the evidence - real score + band.
    expect(
      within(scorebox as HTMLElement).getByText(SCOREHERO_EVIDENCE.summary),
    ).toBeInTheDocument();
  });

  it("renders the category breakdown only from real evidence (LND-7)", async () => {
    await renderPage();
    const header = screen.queryByText("Desglose por categoría");
    if (SCOREHERO_EVIDENCE.categoryScores.length === 0) {
      // A3.2: evidence pending - no invented per-dimension numbers are shown.
      expect(header).toBeNull();
      return;
    }
    // Evidence fixed: the breakdown mirrors the verified GeminiView categories.
    expect(header).not.toBeNull();
    const table = header?.closest("div.overflow-hidden");
    expect(table).not.toBeNull();
    for (const category of SCOREHERO_EVIDENCE.categoryScores) {
      expect(
        within(table as HTMLElement).getAllByText(category.name).length,
      ).toBeGreaterThan(0);
      if (category.score !== null) {
        // Two categories may share a score - use the AllBy variant.
        expect(
          within(table as HTMLElement).getAllByText(String(category.score))
            .length,
        ).toBeGreaterThan(0);
      } else {
        // APT-11: a null row renders honestly as "No medido".
        expect(
          within(table as HTMLElement).getAllByText("No medido").length,
        ).toBeGreaterThan(0);
      }
      // Every v3.1 weight is distinct - assert presence, not uniqueness.
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
    // The /pricing route is deleted (WU-1) - the landing must not link it.
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

  // LND-9 (sprint 9): inline Organization + WebSite JSON-LD in the SSR HTML -
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
    expect(org.name).toBe("Relevy");
    expect(org.url).toMatch(/^https?:\/\//);
    expect(Array.isArray(org.sameAs)).toBe(true);
    // LND-9 (sprint 12): sameAs links the real, verifiable profiles - the
    // founder's GitHub, LinkedIn and personal site - never the repo or
    // invented handles.
    expect(org.sameAs).toContain("https://github.com/ezefernandezyf");
    expect(org.sameAs).toContain(
      "https://www.linkedin.com/in/ezequiel-fernandez-59a21a387/",
    );
    expect(org.sameAs).toContain("https://ezefernandez.com");
    const site = payloads.find((payload) => payload["@type"] === "WebSite");
    expect(site.potentialAction).toBeDefined();
  });

  // LND-9 (sprint 12): the Organization node carries the recommended
  // properties populated with real Relevy data - nothing invented (LND-7).
  it("emits the recommended Organization properties with real data (LND-9)", async () => {
    const { container } = await renderPage();
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const payloads = [...scripts].map((script) =>
      JSON.parse(script.textContent ?? ""),
    );
    const org = payloads.find((payload) => payload["@type"] === "Organization");

    expect(org.knowsAbout).toContain("GEO");
    expect(org.founder).toEqual({
      "@type": "Person",
      name: "Ezequiel Alejandro Fernandez",
      sameAs: ORG_SAME_AS,
    });
    expect(org.address).toEqual({
      "@type": "PostalAddress",
      addressCountry: "AR",
      addressLocality: "Ciudad Autónoma de Buenos Aires",
    });
    expect(org.contactPoint).toMatchObject({
      "@type": "ContactPoint",
      email: "ezefernandezyf@gmail.com",
    });
    expect(org.email).toBe("ezefernandezyf@gmail.com");
    expect(org.foundingDate).toBe("2026-08-05");
    expect(org.logo).toMatch(/og\.png$/);
  });

  // LND-12 (sprint 9): E-E-A-T trust signals - external citations to authority
  // domains (the authoritativeness engine rewards absolute http(s) links and
  // known authority hosts). The contact link lives in the Footer (tested in
  // src/ui/__tests__/footer.test.tsx - this render covers <main> only).
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

  // LND-13 (sprint 12): a visible FAQ section with real questions. Per the
  // product decision, NO FAQPage JSON-LD is emitted (the engine docks
  // FAQPage as deprecated, RSC-7) - the visible Q&A is the signal.
  it("renders a visible FAQ section with real questions (LND-13)", async () => {
    await renderPage();
    const faq = screen.getByText(
      "Respuestas rápidas sobre GEO y visibilidad en IA",
    );
    expect(faq).toBeInTheDocument();
    expect(
      screen.getByText("¿Qué es el GEO Score y cómo se calcula?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("¿Qué motores de búsqueda con IA analiza Relevy?"),
    ).toBeInTheDocument();
  });

  // LND-13 (sprint 12): the page emits NO FAQPage JSON-LD block - only the
  // Organization + WebSite scripts (decision: FAQPage is deprecated RSC-7).
  it("does not emit FAQPage JSON-LD (LND-13 product decision)", async () => {
    const { container } = await renderPage();
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const payloads = [...scripts].map((script) =>
      JSON.parse(script.textContent ?? ""),
    );
    const types = payloads.map((payload) => payload["@type"]);
    expect(types).not.toContain("FAQPage");
  });

  // LND-13 (sprint 16): the content section keeps its real datePublished -
  // the byline moved to the global footer (SHL-11), so the name/role are
  // asserted in footer.test.tsx / the shell render, not here.
  it("renders a real datePublished on the content section (LND-13)", async () => {
    await renderPage();
    expect(screen.getByText(/Publicado el 2026-08-20/)).toBeInTheDocument();
  });

  // SHL-11 (sprint 16): the byline belongs to the shell - it MUST NOT appear
  // inside the page-only <Page/> render (the footer owns it).
  it("keeps the author byline out of the page-only render (SHL-11)", async () => {
    await renderPage();
    expect(
      screen.queryByText("Ezequiel Alejandro Fernandez"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Fundador de Relevy/)).not.toBeInTheDocument();
  });

  // LND-13 (sprint 12): every <img> on the landing has a descriptive alt.
  // The landing currently has no <img> elements (only the og:image meta tag),
  // so the invariant holds vacuously - if an image is added it must carry alt.
  it("gives every image a non-empty alt attribute (LND-13)", async () => {
    const { container } = await renderPage();
    const images = container.querySelectorAll("img");
    for (const img of images) {
      const alt = img.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect(alt!.trim()).not.toBe("");
    }
  });

  // LND-13 (sprint 13): the visible FAQ must carry at least five recognizable
  // questions - every item renders, and each question is query-matchable.
  it("renders at least five recognizable FAQ questions (LND-13)", async () => {
    await renderPage();
    for (const item of LANDING_COPY.faq.items) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    }
    expect(LANDING_COPY.faq.items.length).toBeGreaterThanOrEqual(5);
  });

  // LND-14 (sprint 13): a real <table> with at least 3 rows of real Relevy
  // facts - the bands section is a div composition, so getByRole("table")
  // resolves uniquely to the comparison table.
  it("renders the comparison table with at least three real rows (LND-14)", async () => {
    await renderPage();
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    const rows = within(table).getAllByRole("row");
    // Header row + at least 3 data rows.
    expect(rows.length).toBeGreaterThanOrEqual(4);
    // Real cells render - never placeholders.
    expect(
      within(table).getByText("Menos de 30 segundos por URL"),
    ).toBeInTheDocument();
    expect(
      within(table).getByText("Gratis: 10 auditorías por ventana de 30 días"),
    ).toBeInTheDocument();
  });

  // LND-14 (sprint 15): at 360px the comparison table must stay legible - the
  // wrapper scrolls horizontally (overflow-x-auto) instead of clipping
  // (overflow-hidden) and the <table> keeps a min-width so columns don't
  // squeeze. The semantic <table> markup is preserved (RCI-5/RPL-10).
  it("keeps the comparison table scrollable on mobile with a legible min-width (LND-14)", async () => {
    await renderPage();
    const table = screen.getByRole("table");
    // Semantic table with real data survives the responsive change.
    expect(within(table).getAllByRole("row").length).toBeGreaterThanOrEqual(4);
    const wrapper = table.parentElement;
    expect(wrapper?.className).toContain("overflow-x-auto");
    expect(wrapper?.className).not.toContain("overflow-hidden");
    expect(table.className).toContain("min-w-[640px]");
  });

  // LND-13 (sprint 13): the key content headings are phrased as questions
  // (query-matchable, RCI-5/RPL-8) - not just the hero H1.
  it("phrases the key section headings as questions (LND-13)", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "¿Cómo analiza Relevy su visibilidad en los motores de IA?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "¿Qué es el GEO Score?" }),
    ).toBeInTheDocument();
  });

  // T9 (sprint 13): the ScoreHero evidence must carry the six v3 rows,
  // brand included - the breakdown renders only from this evidence (LND-7).
  it("fixes six category rows in the ScoreHero evidence, brand included (T9)", async () => {
    expect(SCOREHERO_EVIDENCE.categoryScores).toHaveLength(6);
    expect(SCOREHERO_EVIDENCE.categoryScores.map((c) => c.id)).toEqual([
      "crawler",
      "citability",
      "content",
      "schema",
      "platform",
      "brand",
    ]);
    const brand = SCOREHERO_EVIDENCE.categoryScores.find(
      (c) => c.id === "brand",
    );
    expect(brand?.name).toBe("Autoridad de marca");
    expect(brand?.weight).toBe("12%");
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
